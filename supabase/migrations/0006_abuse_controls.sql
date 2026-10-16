-- Purano Dhun — 0006_abuse_controls.sql
--
-- Abuse / integrity controls for the unauthenticated surface, following up on
-- 0005. Everything here is callable by guests by design, so the goal is to make
-- each call *cost something* instead of being free and unbounded.
--
-- 1. play_count manipulation.
--    `log_playback_event()` used to increment `songs.play_count` for anyone who
--    could hit /rest/v1/rpc/log_playback_event with a bare `anon` JWT — a
--    one-line loop could pump a song to the top of admin "most played". Now:
--      * a real listener identity is required (the frontend already calls
--        ensureListenerSession() first, so guests have an anonymous session),
--      * one listener counts at most once per song/event_type per 30 minutes,
--      * a listener may write at most 120 events/minute (flood guard).
--    Losing free telemetry is deliberate: client-supplied counts are only worth
--    recording when they are attributable.
--
-- 2. Takedown spam.
--    `submit_takedown()` was unlimited: one script could fill takedown_requests
--    with junk tickets (and the audit log with them). Now capped at 5 tickets
--    per hour per claimant email / per reporter session.
--
-- 3. Authz consistency.
--    The public `get_genre_categories(p_include_inactive)` let `anon` flip the
--    same toggle the admin-only `admin_genre_categories()` exposes. The public
--    one now always returns active rows; the parameter is kept only so the
--    signature (and the frontend call site) stays unchanged.

begin;

-- ---------------------------------------------------------------------------
-- Supporting columns + indexes for the throttles
-- ---------------------------------------------------------------------------

-- Who filed a takedown (null for a guest with no session).
alter table public.takedown_requests
    add column if not exists reporter_id uuid;

create index if not exists takedown_requests_email_time_idx
    on public.takedown_requests (claimant_email, created_at);
create index if not exists takedown_requests_reporter_time_idx
    on public.takedown_requests (reporter_id, created_at);

-- Drives both the per-minute flood guard and the 30-minute play_count dedup.
create index if not exists playback_events_session_time_idx
    on public.playback_events (session_id, timestamp);

-- ---------------------------------------------------------------------------
-- 1. log_playback_event: identified, deduplicated, rate-limited telemetry
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
declare
    v_session text;
    v_recent  integer;
    v_counted boolean := false;
begin
    -- Validate first so a bad enum is reported as such regardless of identity.
    if p_event_type not in ('start', 'complete', 'skip', 'error') then
        raise exception 'Invalid event_type %', p_event_type;
    end if;

    v_session := coalesce(auth.uid()::text, '');
    if v_session = '' then
        raise exception 'Session key or user authentication required';
    end if;

    -- Flood guard: telemetry is best effort, so drop quietly when a single
    -- listener is writing faster than any human possibly could.
    select count(*) into v_recent
    from public.playback_events
    where session_id = v_session
      and timestamp > now() - interval '1 minute';
    if v_recent >= 120 then
        return jsonb_build_object('status', 'throttled');
    end if;

    -- Decide BEFORE inserting, otherwise the row we are about to write would
    -- match its own dedup window. One increment per listener/song/30 minutes.
    if p_event_type in ('start', 'complete') and p_song_id is not null then
        select not exists (
            select 1
            from public.playback_events
            where session_id = v_session
              and song_id = p_song_id
              and event_type = p_event_type
              and timestamp > now() - interval '30 minutes'
        ) into v_counted;
    end if;

    insert into public.playback_events (event_type, song_id, station_id, session_id, error_message)
    values (
        p_event_type,
        p_song_id,
        p_station_id,
        v_session,
        left(coalesce(p_error_message, ''), 1000)
    );

    if v_counted then
        update public.songs set play_count = play_count + 1 where id = p_song_id;
    end if;

    return jsonb_build_object('status', 'recorded');
end;
$$;

-- ---------------------------------------------------------------------------
-- 2. submit_takedown: bounded submissions per claimant identity
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
    v_uid       uuid := auth.uid();
    v_email     text;
    v_recent    integer;
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

    v_email := lower(btrim(p_claimant_email));

    -- Rate limit AFTER input validation so real validation errors keep
    -- reporting correctly, and so an invalid payload can never probe the
    -- throttle. 5/hour is plenty for a genuine rights holder.
    select count(*) into v_recent
    from public.takedown_requests
    where created_at > now() - interval '1 hour'
      and (claimant_email = v_email
           or (v_uid is not null and reporter_id = v_uid));
    if v_recent >= 5 then
        raise exception 'Too many reports from this identity in the last hour. Please try again later.';
    end if;

    insert into public.takedown_requests
        (song_id, claimant_name, claimant_email, reason, details, reporter_id)
    values (
        p_song,
        left(btrim(p_claimant_name), 200),
        v_email,
        p_reason,
        left(coalesce(p_details, ''), 5000),
        v_uid
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
            'claimant_email', v_email,
            'ticket_id', v_ticket_id
        )
    );

    return jsonb_build_object(
        'message', 'Your report has been received and logged for review.',
        'ticket_id', v_ticket_id
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Public taxonomy reads must not expose admin-only (inactive) rows
-- ---------------------------------------------------------------------------

create or replace function public.get_genre_categories(p_include_inactive boolean default false)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    -- p_include_inactive is intentionally ignored here: admins have
    -- admin_genre_categories(), which is allowlist-guarded. Retaining the
    -- parameter keeps the existing signature and frontend call site intact.
    select coalesce(jsonb_agg(payload order by display_order, name), '[]'::jsonb)
    from (
        select
            c.display_order,
            c.name,
            jsonb_build_object(
                'id', c.id,
                'slug', c.slug,
                'name', c.name,
                'name_ne', c.name_ne,
                'description', c.description,
                'display_order', c.display_order,
                'is_active', c.is_active,
                'genres_count', (select count(*) from public.genres g where g.category = c.slug),
                'created_at', c.created_at
            ) as payload
        from public.genre_categories c
        where c.is_active
    ) t;
$$;

commit;
