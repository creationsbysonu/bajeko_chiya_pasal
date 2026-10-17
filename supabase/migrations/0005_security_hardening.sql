-- Bajeko Chiya Pasal — 0005_security_hardening.sql
-- Closes the gaps found in a full-project security review.
--
-- 1. INTERNAL HELPER LOCKDOWN (the important one)
--
--    PostgREST exposes *every* function in the `public` schema at
--    /rest/v1/rpc/<fn>, and Postgres grants EXECUTE on new functions to PUBLIC
--    by default. RLS (0004) only protects tables — it does nothing for
--    functions. So the SECURITY DEFINER helpers in 0002/0003 were reachable
--    directly by the `anon` role:
--
--      _audit()              -> forge arbitrary audit_logs rows (undermines the
--                               audit trail SECURITY.md promises) and insert
--                               unbounded rows.
--      _song_payload()       -> read ANY song payload, including draft /
--                               disputed / taken_down rows: it has no
--                               publication_status filter, so it bypassed the
--                               one get_song_detail()/get_songs() apply.
--      _songs_payload()      -> same, for a list of ids.
--      _station_queue_rows() -> a station's full queue incl. unpublished songs
--                               (admin_station_queue_get() minus the allowlist).
--      _bulk_target_ids()    -> enumerate unpublished song ids.
--      _unique_slug()        -> drive `execute format(...)` against an
--                               arbitrary public table (schema probing).
--      _apply_song_payload() -> validation oracle.
--
--    Revoking EXECUTE from the browser roles removes those endpoints. It does
--    NOT break the RPC layer: every caller is itself SECURITY DEFINER, so the
--    nested call is privilege-checked as the function *owner*, not as
--    anon/authenticated.
--
--    NOTE for future helpers: any new function added to `public` is
--    auto-exposed. Either prefix it with `_` *and* re-run this revoke, or
--    revoke EXECUTE explicitly where you create it.
--
-- 2. get_takedown_status() was an IDOR: p_email defaulted to '' and an empty
--    email skipped the ownership check, so anyone could walk the sequential
--    ticket ids and read status + admin-written resolution_notes.
--
-- 3. log_playback_event() / submit_takedown() accepted unbounded free text,
--    letting unauthenticated callers bloat playback_events / takedown_requests.

begin;

-- ---------------------------------------------------------------------------
-- 1. Internal helper functions -> not callable by browser roles
-- ---------------------------------------------------------------------------

do $$
declare
    fn record;
    revoked text[] := '{}';
begin
    for fn in
        select p.proname,
               pg_get_function_identity_arguments(p.oid) as argtypes
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and left(p.proname, 1) = '_'   -- our internal helpers
          and p.prosecdef                -- ...which are SECURITY DEFINER
        order by p.proname
    loop
        execute format(
            'revoke execute on function public.%I(%s) from public, anon, authenticated',
            fn.proname,
            fn.argtypes
        );
        revoked := revoked || fn.proname;
    end loop;

    raise notice 'internal helpers locked down: %',
                 coalesce(array_to_string(revoked, ', '), '(none found)');
end $$;

-- ---------------------------------------------------------------------------
-- 2. Takedown status lookup: require proof of ticket ownership
-- ---------------------------------------------------------------------------

create or replace function public.get_takedown_status(p_ticket_id bigint, p_email text default '')
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    t record;
    v_email text := coalesce(btrim(p_email), '');
begin
    -- Ticket ids are sequential, so they are trivially enumerable: never let
    -- the lookup happen without the claimant email that owns the ticket.
    if v_email = '' then
        raise exception 'claimant email is required to look up a ticket.';
    end if;
    if length(v_email) > 320 then
        raise exception 'Email does not match this ticket.';
    end if;

    select
        tr.id, tr.status, tr.reason, tr.resolution_notes, tr.created_at, tr.resolved_at,
        tr.claimant_email, s.title as song_title, a.display_name as artist_name
    into t
    from public.takedown_requests tr
    join public.songs s on s.id = tr.song_id
    left join public.artists a on a.id = s.artist_id
    where tr.id = p_ticket_id;

    if not found then
        raise exception 'Ticket not found';
    end if;
    if lower(t.claimant_email) <> lower(v_email) then
        raise exception 'Email does not match this ticket.';
    end if;

    return jsonb_build_object(
        'ticket_id', t.id,
        'status', t.status,
        'reason', t.reason,
        'song_title', t.song_title,
        'artist_name', t.artist_name,
        'resolution_notes', t.resolution_notes,
        'created_at', t.created_at,
        'resolved_at', t.resolved_at
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Bound free-text telemetry so unauthenticated callers cannot bloat tables
-- ---------------------------------------------------------------------------

create or replace function public.log_playback_event(
    p_event_type text,
    p_song_id bigint default null,
    p_station_id bigint default null,
    p_error_message text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if p_event_type not in ('start', 'complete', 'skip', 'error') then
        raise exception 'Invalid event_type %', p_event_type;
    end if;

    insert into public.playback_events (event_type, song_id, station_id, session_id, error_message)
    values (
        p_event_type,
        p_song_id,
        p_station_id,
        coalesce(auth.uid()::text, ''),
        left(coalesce(p_error_message, ''), 1000)
    );

    -- The old Django view incremented the denormalised counter on start/complete.
    if p_event_type in ('start', 'complete') and p_song_id is not null then
        update public.songs set play_count = play_count + 1 where id = p_song_id;
    end if;

    return jsonb_build_object('status', 'recorded');
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Bound free-text takedown submissions
-- ---------------------------------------------------------------------------

create or replace function public.submit_takedown(
    p_song bigint,
    p_claimant_name text,
    p_claimant_email text,
    p_reason text,
    p_details text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_ticket_id bigint;
begin
    if p_song is null then
        raise exception 'song: This field is required.';
    end if;
    if p_claimant_name is null or btrim(p_claimant_name) = '' then
        raise exception 'claimant_name: This field is required.';
    end if;
    if p_claimant_email is null
       or length(btrim(p_claimant_email)) > 320
       or p_claimant_email !~ '^[^@]+@[^@]+\.[^@]+$' then
        raise exception 'claimant_email: Enter a valid email address.';
    end if;
    if p_reason not in ('copyright', 'broken_video', 'wrong_metadata', 'other') then
        raise exception 'reason: Not a valid choice.';
    end if;
    if not exists (select 1 from public.songs where id = p_song) then
        raise exception 'song: Song not found.';
    end if;

    insert into public.takedown_requests (song_id, claimant_name, claimant_email, reason, details)
    values (
        p_song,
        left(btrim(p_claimant_name), 200),
        lower(btrim(p_claimant_email)),
        p_reason,
        left(coalesce(p_details, ''), 5000)
    )
    returning id into v_ticket_id;

    insert into public.audit_logs (actor_username, action, target_model, target_id, details)
    values (
        'public_reporter',
        'TAKEDOWN_SUBMITTED',
        'Song',
        p_song::text,
        jsonb_build_object(
            'reason', p_reason,
            'claimant_email', lower(btrim(p_claimant_email)),
            'ticket_id', v_ticket_id
        )
    );

    return jsonb_build_object(
        'message', 'Your report has been received and logged for review.',
        'ticket_id', v_ticket_id
    );
end;
$$;

commit;
