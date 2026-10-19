-- Bajeko Chiya Pasal — 0013_security_persistence.sql
-- Moves the grant model behind RLS instead of beside it, pins the function
-- surface to the explicit RPC layer, and adds the missing global backstop on
-- takedown submissions.
--
-- 1. TABLE + SEQUENCE GRANTS (existing objects and future ones)
--
--    Supabase grants every table and sequence in `public` to `anon` and
--    `authenticated` — the current ones and, via `alter default privileges`,
--    every one created later. RLS (0004) with zero policies was therefore the
--    ONLY barrier between a browser role and raw table access. The frontend is
--    RPC-only (it never queries a table through PostgREST), so those grants go
--    away entirely:
--
--      - `revoke … on all tables / all sequences` clears the existing ones,
--      - `alter default privileges … revoke` stops future ones from being
--        handed out (service_role keeps both, for server-side tooling).
--
--    Schema USAGE on `public` stays granted — PostgREST needs it to resolve
--    the /rpc/* endpoints at all.
--
-- 2. submit_takedown(): the 5/hour per-identity throttle (0006, unchanged and
--    deliberately not a 24h dedup — a rights holder reporting several songs
--    must keep reporting) is farmable by rotating emails. A global 50/hour
--    window across all identities backs it; every submission also writes an
--    audit_logs row, so unbounded rotations were free bloat.
--
-- 3. FUNCTION EXECUTE (runs last so it is the final word on grants, whatever
--    CREATE OR REPLACE above did to existing ACLs).
--
--    One blanket revoke strips the implicit PUBLIC execute from every function
--    in `public`; one loop gives it back only to the RPC layer: SECURITY
--    DEFINER functions not prefixed with `_`. What stays locked to the
--    function owner (postgres):
--
--      - `_`-helpers (0005) — audit forgery, draft enumeration, probing,
--      - slugify() / song_sync_decade() — the only two non-definer functions
--        in the schema; definer RPCs and the songs trigger run as the owner,
--        so both keep working for every real call path.
--
--    NOTE for future functions: `alter default privileges … revoke execute on
--    functions` CANNOT lock down new functions. The revoke only edits the
--    stored default-ACL row (a no-op while that row is empty), and every new
--    function still receives the implicit PUBLIC grant at creation — verified
--    against PGlite. So a new `_`-helper must revoke EXECUTE where it is
--    created (the 0005 rule), and verify.mjs enforces the invariant that a
--    browser role can only ever execute a non-underscore SECURITY DEFINER
--    function.
--
-- Idempotent: safe to re-run, including from the generated
-- deploy/upgrade_festive.sql.

begin;

-- ---------------------------------------------------------------------------
-- 1. Table + sequence grants: browser roles go RPC-only
-- ---------------------------------------------------------------------------

-- Future objects: stop Supabase-style default grants reaching anon/authenticated.
alter default privileges in schema public
    revoke all on tables from anon, authenticated;
alter default privileges in schema public
    revoke usage, select on sequences from anon, authenticated;

-- Existing objects: strip them too (service_role keeps full access).
revoke all on all tables in schema public from anon, authenticated;
revoke usage, select on all sequences in schema public from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. submit_takedown: global flood window behind the per-identity throttle
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
    v_global    integer;
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
    -- throttle. 5/hour is plenty for a genuine rights holder. This runs
    -- before the global window so one identity always sees its own message.
    select count(*) into v_recent
    from public.takedown_requests
    where created_at > now() - interval '1 hour'
      and (claimant_email = v_email
           or (v_uid is not null and reporter_id = v_uid));
    if v_recent >= 5 then
        raise exception 'Too many reports from this identity in the last hour. Please try again later.';
    end if;

    -- Global backstop: the per-identity cap is farmable with rotated emails,
    -- and every submission writes an audit_logs row.
    select count(*) into v_global
    from public.takedown_requests
    where created_at > now() - interval '1 hour';
    if v_global >= 50 then
        raise exception 'Too many reports in the last hour. Please try again later.';
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
-- 3. Function execute: strip the implicit PUBLIC grant, re-grant the RPC layer
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public
    from public, anon, authenticated, service_role;

do $$
declare
    fn record;
    granted integer := 0;
begin
    for fn in
        select p.proname,
               pg_get_function_identity_arguments(p.oid) as argtypes
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.prokind = 'f'
          and p.prosecdef              -- the RPC layer runs as its owner
          and left(p.proname, 1) <> '_'
        order by p.proname
    loop
        execute format(
            'grant execute on function public.%I(%s) to anon, authenticated, service_role',
            fn.proname,
            fn.argtypes
        );
        granted := granted + 1;
    end loop;

    raise notice 'RPC surface re-granted to browser/server roles: % function(s)', granted;
end $$;

commit;
