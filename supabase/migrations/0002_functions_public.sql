-- Purano Dhun — 0002_functions_public.sql
-- Every read/write the website performs goes through these SECURITY DEFINER
-- RPCs, which reproduce the response shapes of the old Django REST API exactly
-- (snake_case keys, DRF pagination envelopes, error message strings).
--
-- Tables therefore need no direct-access RLS policies at all (see 0004_rls):
-- locked tables + definer functions = a single, auditable API surface.

begin;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

-- Django-slugify equivalent: lowercase, non-alphanumeric runs become '-'.
create or replace function public.slugify(p_input text)
returns text
language sql
immutable
as $$
    select trim(both '-' from regexp_replace(lower(coalesce(p_input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

-- The admins allowlist is the single source of truth for admin access.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.admin_actor()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select coalesce(
        (select split_part(email, '@', 1) from auth.users where id = auth.uid()),
        'admin'
    );
$$;

create or replace function public._audit(
    p_action text,
    p_target_model text,
    p_target_id text,
    p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
    insert into public.audit_logs (actor_username, action, target_model, target_id, details)
    values (public.admin_actor(), p_action, p_target_model, p_target_id, coalesce(p_details, '{}'::jsonb));
$$;

-- Django-style slug uniqueness: base, base-2, base-3, ...
create or replace function public._unique_slug(p_base text, p_table text, p_exclude_id bigint default null)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    candidate text := p_base;
    counter integer := 2;
    taken boolean;
begin
    loop
        execute format(
            'select exists (select 1 from public.%I where slug = $1 and ($2::bigint is null or id <> $2))',
            p_table
        ) into taken using candidate, p_exclude_id;
        if not taken then
            return candidate;
        end if;
        candidate := p_base || '-' || counter;
        counter := counter + 1;
    end loop;
end;
$$;

-- Build the SongSerializer payload for an ordered list of ids.
create or replace function public._songs_payload(p_ids bigint[])
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select coalesce(jsonb_agg(payload order by array_position(p_ids, t.id)), '[]'::jsonb)
    from (
        select
            s.id,
            jsonb_build_object(
                'id', s.id,
                'title', s.title,
                'title_ne', s.title_ne,
                'romanized_title', s.romanized_title,
                'artist', s.artist_id,
                'artist_name', a.display_name,
                'artist_name_ne', a.display_name_ne,
                'featured_artists', s.featured_artists,
                'composer', s.composer,
                'lyricist', s.lyricist,
                'album', s.album,
                'film_or_source', s.film_or_source,
                'release_year', s.release_year,
                'language', s.language,
                'primary_genre', s.primary_genre_id,
                'primary_genre_name', g.name,
                'primary_genre_name_ne', g.name_ne,
                'primary_genre_category', coalesce(g.category, ''),
                'secondary_genres', coalesce(sg.genre_ids, '[]'::jsonb),
                'secondary_genre_names', coalesce(sg.genre_names, '[]'::jsonb),
                'mood_tags', s.mood_tags,
                'decade', s.decade,
                'duration_seconds', s.duration_seconds,
                'artwork_url', s.artwork_url,
                'playback_provider', s.playback_provider,
                'provider_video_id', s.provider_video_id,
                'provider_url', s.provider_url,
                'source_url', s.source_url,
                'attribution', s.attribution,
                'metadata_verification_status', s.metadata_verification_status,
                'publication_status', s.publication_status,
                'play_count', s.play_count,
                'is_featured', s.is_featured,
                'featured_order', s.featured_order,
                'created_at', s.created_at
            ) as payload
        from public.songs s
        join public.artists a on a.id = s.artist_id
        left join public.genres g on g.id = s.primary_genre_id
        left join (
            select
                ss.song_id,
                jsonb_agg(ss.genre_id order by ss.genre_id) as genre_ids,
                jsonb_agg(gen.name order by ss.genre_id) as genre_names
            from public.song_secondary_genres ss
            join public.genres gen on gen.id = ss.genre_id
            group by ss.song_id
        ) sg on sg.song_id = s.id
        where s.id = any (p_ids)
    ) t;
$$;

create or replace function public._song_payload(p_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select public._songs_payload(array[p_id]) -> 0;
$$;

-- ---------------------------------------------------------------------------
-- Public catalog RPCs
-- ---------------------------------------------------------------------------

create or replace function public.get_stations()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select coalesce(jsonb_agg(payload order by display_order, title), '[]'::jsonb)
    from (
        select
            st.display_order,
            st.title,
            jsonb_build_object(
                'id', st.id,
                'slug', st.slug,
                'title', st.title,
                'title_ne', st.title_ne,
                'tagline', st.tagline,
                'tagline_ne', st.tagline_ne,
                'description', st.description,
                'description_ne', st.description_ne,
                'cover_image', st.cover_image,
                'theme_color', st.theme_color,
                'ambient_type', st.ambient_type,
                'is_featured', st.is_featured,
                'is_active', st.is_active,
                'display_order', st.display_order,
                'songs_count', (
                    select count(*)
                    from public.station_songs ss
                    join public.songs s2 on s2.id = ss.song_id and s2.publication_status = 'published'
                    where ss.station_id = st.id
                )
            ) as payload
        from public.stations st
        where st.is_active
    ) t;
$$;

create or replace function public.get_station_detail(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    st record;
    result jsonb;
begin
    select * into st from public.stations where slug = p_slug and is_active;
    if not found then
        raise exception 'Station not found';
    end if;

    select jsonb_build_object(
        'id', st.id,
        'slug', st.slug,
        'title', st.title,
        'title_ne', st.title_ne,
        'tagline', st.tagline,
        'tagline_ne', st.tagline_ne,
        'description', st.description,
        'description_ne', st.description_ne,
        'cover_image', st.cover_image,
        'theme_color', st.theme_color,
        'ambient_type', st.ambient_type,
        'is_featured', st.is_featured,
        'station_songs', coalesce((
            select jsonb_agg(
                jsonb_build_object('id', ss.id, 'position', ss.position, 'song', sp.song)
                order by ss.position, ss.id
            )
            from public.station_songs ss
            cross join lateral (
                select public._song_payload(ss.song_id) as song
            ) sp
            where ss.station_id = st.id
              and exists (
                  select 1 from public.songs s
                  where s.id = ss.song_id and s.publication_status = 'published'
              )
        ), '[]'::jsonb)
    ) into result;

    return result;
end;
$$;

create or replace function public.get_songs(
    p_search text default '',
    p_genre text default '',
    p_decade text default '',
    p_language text default '',
    p_verification text default '',
    p_ordering text default '-release_year',
    p_page integer default 1,
    p_page_size integer default 24
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    v_count bigint;
    v_page integer := greatest(coalesce(p_page, 1), 1);
    v_size integer := least(greatest(coalesce(p_page_size, 24), 1), 100);
    v_order text;
    v_ids bigint[];
    v_results jsonb;
begin
    if p_ordering in (
        '-release_year', 'release_year', 'title', '-title',
        '-play_count', 'play_count', '-created_at'
    ) then
        v_order := p_ordering;
    else
        v_order := '-release_year';
    end if;

    with filtered as (
        select s.id, s.release_year, s.title, s.play_count, s.created_at
        from public.songs s
        join public.artists a on a.id = s.artist_id
        where s.publication_status = 'published'
          and (
              coalesce(p_search, '') = '' or
              s.title ilike '%' || p_search || '%' or
              s.title_ne ilike '%' || p_search || '%' or
              s.romanized_title ilike '%' || p_search || '%' or
              a.display_name ilike '%' || p_search || '%' or
              a.display_name_ne ilike '%' || p_search || '%' or
              s.album ilike '%' || p_search || '%' or
              s.composer ilike '%' || p_search || '%' or
              s.lyricist ilike '%' || p_search || '%'
          )
          and (
              coalesce(p_genre, '') = '' or
              s.primary_genre_id in (select id from public.genres where slug = p_genre) or
              s.id in (select song_id from public.song_secondary_genres ss
                       join public.genres g on g.id = ss.genre_id where g.slug = p_genre)
          )
          and (coalesce(p_decade, '') = '' or s.decade = p_decade)
          and (coalesce(p_language, '') = '' or lower(s.language) = lower(p_language))
          and (coalesce(p_verification, '') = '' or s.metadata_verification_status = p_verification)    ), ordered as (
        select id from filtered
        order by
            case when v_order = '-release_year' then release_year end desc nulls last,
            case when v_order = '-release_year' then title end asc,
            case when v_order = 'release_year' then release_year end asc nulls last,
            case when v_order = 'title' then title end asc,
            case when v_order = '-title' then title end desc,
            case when v_order = '-play_count' then play_count end desc,
            case when v_order = 'play_count' then play_count end asc,
            case when v_order = '-created_at' then created_at end desc,
            id desc
    ),
    page_rows as (
        select id from ordered
        limit v_size offset (v_page - 1) * v_size
    )
    select
        (select count(*) from filtered),
        coalesce((select array_agg(id) from page_rows), '{}'::bigint[])
    into v_count, v_ids;

    v_results := public._songs_payload(v_ids);

    return jsonb_build_object(
        'count', v_count,
        'next', case when v_page * v_size < v_count
                     then '/api/songs/?page=' || (v_page + 1) else null end,
        'previous', case when v_page > 1
                         then '/api/songs/?page=' || (v_page - 1) else null end,
        'results', v_results
    );
end;
$$;

create or replace function public.get_song_detail(p_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    v_result jsonb;
begin
    select public._song_payload(s.id) into v_result
    from public.songs s
    where s.id = p_id and s.publication_status = 'published';

    if v_result is null then
        raise exception 'Song not found';
    end if;
    return v_result;
end;
$$;

create or replace function public.get_genres()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select coalesce(jsonb_agg(payload order by category, name), '[]'::jsonb)
    from (
        select
            g.category,
            g.name,
            jsonb_build_object(
                'id', g.id,
                'name', g.name,
                'name_ne', g.name_ne,
                'slug', g.slug,
                'category', g.category,
                'description', g.description,
                'is_active', g.is_active,
                'songs_count', (
                    select count(*) from public.songs s
                    where s.primary_genre_id = g.id and s.publication_status = 'published'
                )
            ) as payload
        from public.genres g
        where g.is_active
    ) t;
$$;

create or replace function public.get_genre_categories(p_include_inactive boolean default false)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
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
                'songs_count', (
                    select count(*) from public.songs s
                    join public.genres g2 on g2.id = s.primary_genre_id
                    where g2.category = c.slug
                ),
                'created_at', c.created_at
            ) as payload
        from public.genre_categories c
        where p_include_inactive or c.is_active
    ) t;
$$;

create or replace function public.get_artists(p_search text default '')
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select coalesce(jsonb_agg(payload order by songs_count desc, display_name), '[]'::jsonb)
    from (
        select
            a.display_name,
            (
                select count(*) from public.songs s
                where s.artist_id = a.id and s.publication_status = 'published'
            ) as songs_count,
            jsonb_build_object(
                'id', a.id,
                'display_name', a.display_name,
                'display_name_ne', a.display_name_ne,
                'biography', a.biography,
                'biography_ne', a.biography_ne,
                'profile_image', a.profile_image,
                'verification_status', a.verification_status,
                'songs_count', (
                    select count(*) from public.songs s
                    where s.artist_id = a.id and s.publication_status = 'published'
                ),
                'created_at', a.created_at
            ) as payload
        from public.artists a
        where coalesce(p_search, '') = ''
           or a.display_name ilike '%' || p_search || '%'
           or a.display_name_ne ilike '%' || p_search || '%'
    ) t;
$$;

create or replace function public.get_decades()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select coalesce(
        jsonb_agg(jsonb_build_object('decade', decade, 'count', cnt) order by decade),
        '[]'::jsonb
    )
    from (
        select decade, count(*) as cnt
        from public.songs
        where publication_status = 'published' and decade > ''
        group by decade
    ) t;
$$;

create or replace function public.get_languages()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select coalesce(
        jsonb_agg(jsonb_build_object('language', language, 'count', cnt) order by language),
        '[]'::jsonb
    )
    from (
        select language, count(*) as cnt
        from public.songs
        where publication_status = 'published'
        group by language
    ) t;
$$;

create or replace function public.get_featured()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    v_stations jsonb;
    v_songs jsonb;
    v_pinned_ids bigint[];
    v_ids bigint[];
begin
    select coalesce(jsonb_agg(payload order by display_order, title), '[]'::jsonb)
    into v_stations
    from (
        select
            st.display_order,
            st.title,
            jsonb_build_object(
                'id', st.id,
                'slug', st.slug,
                'title', st.title,
                'title_ne', st.title_ne,
                'tagline', st.tagline,
                'tagline_ne', st.tagline_ne,
                'description', st.description,
                'description_ne', st.description_ne,
                'cover_image', st.cover_image,
                'theme_color', st.theme_color,
                'ambient_type', st.ambient_type,
                'is_featured', st.is_featured,
                'is_active', st.is_active,
                'display_order', st.display_order,
                'songs_count', (
                    select count(*)
                    from public.station_songs ss
                    join public.songs s2 on s2.id = ss.song_id and s2.publication_status = 'published'
                    where ss.station_id = st.id
                )
            ) as payload
        from public.stations st
        where st.is_active and st.is_featured
    ) t;

    -- Manually pinned featured songs first (ordered), auto-fill the rest with
    -- verified published songs; if nothing is pinned, fall back to verified
    -- published songs, then to any published songs.
    select coalesce(array_agg(id), '{}'::bigint[])
    into v_pinned_ids
    from (
        select id from public.songs
        where publication_status = 'published' and is_featured
        order by featured_order, release_year desc nulls last
        limit 8
    ) p;

    if array_length(v_pinned_ids, 1) is not null then
        v_ids := v_pinned_ids;
        if array_length(v_pinned_ids, 1) < 8 then
            select v_pinned_ids || coalesce(array_agg(id), '{}'::bigint[])
            into v_ids
            from (
                select id from public.songs
                where publication_status = 'published'
                  and metadata_verification_status = 'verified'
                  and not (id = any (v_pinned_ids))
                order by play_count desc
                limit 8 - array_length(v_pinned_ids, 1)
            ) f;
        end if;
    else
        select coalesce(array_agg(id), '{}'::bigint[])
        into v_ids
        from (
            select id from public.songs
            where publication_status = 'published'
              and metadata_verification_status = 'verified'
            limit 8
        ) v;

        if array_length(v_ids, 1) is null then
            select coalesce(array_agg(id), '{}'::bigint[])
            into v_ids
            from (
                select id from public.songs
                where publication_status = 'published'
                limit 8
            ) a2;
        end if;
    end if;

    return jsonb_build_object(
        'stations', v_stations,
        'songs', public._songs_payload(v_ids)
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Favorites (identified by the Supabase Auth user — anonymous sessions
-- included; enable "Anonymous sign-ins" in the Supabase dashboard).
-- ---------------------------------------------------------------------------

create or replace function public.get_favorites()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    v_user uuid := auth.uid();
begin
    if v_user is null then
        return '[]'::jsonb;
    end if;

    return coalesce((
        select jsonb_agg(
            jsonb_build_object(
                'id', f.id,
                'session_key', f.user_id::text,
                'song', sp.song,
                'created_at', f.created_at
            )
            order by f.created_at desc
        )
        from public.favorites f
        cross join lateral (select public._song_payload(f.song_id) as song) sp
        where f.user_id = v_user
    ), '[]'::jsonb);
end;
$$;

create or replace function public.add_favorite(p_song_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user uuid := auth.uid();
    v_fav public.favorites;
begin
    if v_user is null then
        raise exception 'Session key or user authentication required';
    end if;
    if not exists (
        select 1 from public.songs
        where id = p_song_id and publication_status = 'published'
    ) then
        raise exception 'Song not found';
    end if;

    insert into public.favorites (user_id, song_id)
    values (v_user, p_song_id)
    on conflict (user_id, song_id) do nothing;

    select * into v_fav from public.favorites
    where user_id = v_user and song_id = p_song_id;

    return jsonb_build_object(
        'id', v_fav.id,
        'session_key', v_fav.user_id::text,
        'song', public._song_payload(v_fav.song_id),
        'created_at', v_fav.created_at
    );
end;
$$;

create or replace function public.remove_favorite(p_song_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_user uuid := auth.uid();
begin
    if v_user is null then
        raise exception 'Session key or authentication required';
    end if;
    if p_song_id is null then
        raise exception 'song_id is required';
    end if;

    delete from public.favorites where user_id = v_user and song_id = p_song_id;
    return jsonb_build_object('message', 'Removed from favorites');
end;
$$;

-- ---------------------------------------------------------------------------
-- Playback telemetry
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
        coalesce(p_error_message, '')
    );

    -- The old Django view incremented the denormalised counter on start/complete.
    if p_event_type in ('start', 'complete') and p_song_id is not null then
        update public.songs set play_count = play_count + 1 where id = p_song_id;
    end if;

    return jsonb_build_object('status', 'recorded');
end;
$$;

-- ---------------------------------------------------------------------------
-- Takedown / copyright workflow (public side)
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
    if p_claimant_email is null or p_claimant_email !~ '^[^@]+@[^@]+\.[^@]+$' then
        raise exception 'claimant_email: Enter a valid email address.';
    end if;
    if p_reason not in ('copyright', 'broken_video', 'wrong_metadata', 'other') then
        raise exception 'reason: Not a valid choice.';
    end if;
    if not exists (select 1 from public.songs where id = p_song) then
        raise exception 'song: Song not found.';
    end if;

    insert into public.takedown_requests (song_id, claimant_name, claimant_email, reason, details)
    values (p_song, btrim(p_claimant_name), lower(btrim(p_claimant_email)), p_reason, coalesce(p_details, ''))
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

create or replace function public.get_takedown_status(p_ticket_id bigint, p_email text default '')
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    t record;
begin
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
    if coalesce(p_email, '') <> '' and lower(t.claimant_email) <> lower(btrim(p_email)) then
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

commit;
