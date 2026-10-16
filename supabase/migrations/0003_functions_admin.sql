-- Purano Dhun — 0003_functions_admin.sql
-- Admin RPCs. Every function starts with an is_admin() guard (the admins
-- allowlist), reproduces the old Django admin view behaviour incl. audit-log
-- entries, and raises the same error message strings the frontend surfaces.

begin;

-- ---------------------------------------------------------------------------
-- Auth bridge
-- ---------------------------------------------------------------------------

create or replace function public.admin_current_user()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    u record;
begin
    if auth.uid() is null then
        return jsonb_build_object('authenticated', false);
    end if;

    select id, email, raw_user_meta_data, created_at, last_sign_in_at
    into u from auth.users where id = auth.uid();

    if not found or not public.is_admin() then
        return jsonb_build_object('authenticated', false);
    end if;

    return jsonb_build_object(
        'authenticated', true,
        'username', split_part(coalesce(u.email, 'admin'), '@', 1),
        'full_name', coalesce(u.raw_user_meta_data ->> 'full_name', ''),
        'email', u.email,
        'is_staff', true,
        'is_superuser', false,
        'date_joined', u.created_at,
        'last_login', u.last_sign_in_at,
        'permissions', jsonb_build_object(
            'can_manage_catalog', true,
            'can_review_takedowns', true,
            'can_view_audit_logs', true,
            'can_change_password', true
        )
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Stats & insights
-- ---------------------------------------------------------------------------

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    result jsonb;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select jsonb_build_object(
        'total_songs', (select count(*) from public.songs),
        'published_songs', (select count(*) from public.songs where publication_status = 'published'),
        'verified_songs', (select count(*) from public.songs where metadata_verification_status = 'verified'),
        'pending_takedowns', (select count(*) from public.takedown_requests where status = 'pending'),
        'total_artists', (select count(*) from public.artists),
        'total_stations', (select count(*) from public.stations),
        'total_genres', (select count(*) from public.genres),
        'total_genre_categories', (select count(*) from public.genre_categories),
        'status_breakdown', coalesce((
            select jsonb_object_agg(publication_status, cnt)
            from (select publication_status, count(*) as cnt from public.songs group by publication_status) t
        ), '{}'::jsonb),
        'language_breakdown', coalesce((
            select jsonb_object_agg(language, cnt)
            from (select language, count(*) as cnt from public.songs group by language order by cnt desc) t
        ), '{}'::jsonb),
        'category_breakdown', coalesce((
            select jsonb_object_agg(category, cnt)
            from (
                select g.category, count(*) as cnt
                from public.songs s
                join public.genres g on g.id = s.primary_genre_id
                group by g.category
            ) t
        ), '{}'::jsonb),
        'takedown_breakdown', coalesce((
            select jsonb_object_agg(status, cnt)
            from (select status, count(*) as cnt from public.takedown_requests group by status) t
        ), '{}'::jsonb)
    ) into result;

    return result;
end;
$$;

create or replace function public.admin_insights(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    v_days integer := least(greatest(coalesce(p_days, 30), 1), 365);
    v_since timestamptz := now() - make_interval(days => v_days);
    result jsonb;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select jsonb_build_object(
        'window_days', v_days,
        'total_events', (select count(*) from public.playback_events where timestamp >= v_since),
        'event_breakdown', coalesce((
            select jsonb_object_agg(event_type, cnt)
            from (select event_type, count(*) as cnt
                  from public.playback_events where timestamp >= v_since
                  group by event_type) t
        ), '{}'::jsonb),
        'starts', (select count(*) from public.playback_events where timestamp >= v_since and event_type = 'start'),
        'completes', (select count(*) from public.playback_events where timestamp >= v_since and event_type = 'complete'),
        'skips', (select count(*) from public.playback_events where timestamp >= v_since and event_type = 'skip'),
        'errors', (select count(*) from public.playback_events where timestamp >= v_since and event_type = 'error'),
        'completion_rate', (
            select case when count(*) filter (where event_type = 'start') > 0
                        then round(
                            count(*) filter (where event_type = 'complete')::numeric
                            / count(*) filter (where event_type = 'start') * 100, 1)
                        else 0.0 end
            from public.playback_events where timestamp >= v_since
        ),
        'unique_sessions', (
            select count(distinct session_id)
            from public.playback_events
            where timestamp >= v_since and session_id <> ''
        ),
        'total_favorites', (select count(*) from public.favorites),
        'top_songs', coalesce((
            select jsonb_agg(jsonb_build_object(
                'song_id', pe.song_id, 'title', s.title,
                'artist_name', a.display_name, 'events', pe.events
            ) order by pe.events desc)
            from (
                select song_id, count(*) as events
                from public.playback_events
                where timestamp >= v_since and song_id is not null
                group by song_id
                order by events desc
                limit 10
            ) pe
            join public.songs s on s.id = pe.song_id
            left join public.artists a on a.id = s.artist_id
        ), '[]'::jsonb),
        'most_played', coalesce((
            select jsonb_agg(jsonb_build_object(
                'song_id', s.id, 'title', s.title,
                'artist_name', a.display_name, 'play_count', s.play_count
            ) order by s.play_count desc)
            from (
                select id, artist_id, title, play_count from public.songs
                order by play_count desc limit 10
            ) s
            left join public.artists a on a.id = s.artist_id
        ), '[]'::jsonb),
        'most_favorited', coalesce((
            select jsonb_agg(jsonb_build_object(
                'song_id', f.song_id, 'title', s.title,
                'artist_name', a.display_name, 'favorites', f.favorites
            ) order by f.favorites desc)
            from (
                select song_id, count(*) as favorites
                from public.favorites
                group by song_id
                order by favorites desc
                limit 10
            ) f
            join public.songs s on s.id = f.song_id
            left join public.artists a on a.id = s.artist_id
        ), '[]'::jsonb),
        'top_stations', coalesce((
            select jsonb_agg(jsonb_build_object(
                'station_id', pe.station_id, 'title', st.title, 'events', pe.events
            ) order by pe.events desc)
            from (
                select station_id, count(*) as events
                from public.playback_events
                where timestamp >= v_since and station_id is not null
                group by station_id
                order by events desc
                limit 10
            ) pe
            join public.stations st on st.id = pe.station_id
        ), '[]'::jsonb),
        'error_events', coalesce((
            select jsonb_agg(jsonb_build_object(
                'id', pe.id, 'song_id', pe.song_id, 'song_title', s.title,
                'message', pe.error_message, 'timestamp', pe.timestamp
            ) order by pe.timestamp desc)
            from (
                select id, song_id, error_message, timestamp
                from public.playback_events
                where timestamp >= v_since and event_type = 'error' and song_id is not null
                order by timestamp desc
                limit 20
            ) pe
            left join public.songs s on s.id = pe.song_id
        ), '[]'::jsonb)
    ) into result;

    return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Song management
-- ---------------------------------------------------------------------------

create or replace function public.admin_songs(
    p_search text default '',
    p_status text default '',
    p_genre text default '',
    p_category text default '',
    p_artist text default '',
    p_language text default '',
    p_decade text default '',
    p_verification text default '',
    p_ordering text default '-id',
    p_page integer default 1,
    p_page_size integer default 25
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
    v_size integer := least(greatest(coalesce(p_page_size, 25), 1), 200);
    v_order text;
    v_ids bigint[];
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    if p_ordering in (
        '-release_year', 'release_year', 'title', '-title',
        '-play_count', 'play_count', '-created_at', 'id', '-id'
    ) then
        v_order := p_ordering;
    else
        v_order := '-id';
    end if;

    with filtered as (
        select s.id, s.title, s.release_year, s.play_count, s.created_at
        from public.songs s
        left join public.artists a on a.id = s.artist_id
        where (
              coalesce(p_search, '') = '' or
              s.title ilike '%' || p_search || '%' or
              s.title_ne ilike '%' || p_search || '%' or
              s.romanized_title ilike '%' || p_search || '%' or
              a.display_name ilike '%' || p_search || '%' or
              a.display_name_ne ilike '%' || p_search || '%' or
              s.album ilike '%' || p_search || '%' or
              s.composer ilike '%' || p_search || '%' or
              s.lyricist ilike '%' || p_search || '%' or
              s.provider_video_id ilike '%' || p_search || '%'
          )
          and (coalesce(p_status, '') = '' or s.publication_status = p_status)
          and (
              coalesce(p_genre, '') = '' or
              (p_genre ~ '^[0-9]+$' and (
                  s.primary_genre_id = p_genre::bigint or
                  s.id in (select song_id from public.song_secondary_genres where genre_id = p_genre::bigint)
              )) or
              (p_genre !~ '^[0-9]+$' and (
                  s.primary_genre_id in (select id from public.genres where slug = p_genre) or
                  s.id in (select ss.song_id from public.song_secondary_genres ss
                           join public.genres g on g.id = ss.genre_id where g.slug = p_genre)
              ))
          )
          and (
              coalesce(p_category, '') = '' or
              s.primary_genre_id in (select id from public.genres where category = p_category)
          )
          and (coalesce(p_artist, '') = '' or (
              p_artist ~ '^[0-9]+$' and s.artist_id = p_artist::bigint
          ))
          and (coalesce(p_language, '') = '' or lower(s.language) = lower(p_language))
          and (coalesce(p_decade, '') = '' or s.decade = p_decade)
          and (coalesce(p_verification, '') = '' or s.metadata_verification_status = p_verification)
    ),
    ordered as (
        select id from filtered
        order by
            case when v_order = '-release_year' then release_year end desc nulls last,
            case when v_order = 'release_year' then release_year end asc nulls last,
            case when v_order = 'title' then title end asc,
            case when v_order = '-title' then title end desc,
            case when v_order = '-play_count' then play_count end desc,
            case when v_order = 'play_count' then play_count end asc,
            case when v_order = '-created_at' then created_at end desc,
            case when v_order = 'id' then id end asc,
            case when v_order = '-id' then id end desc
    ),
    page_rows as (
        select id from ordered
        limit v_size offset (v_page - 1) * v_size
    )
    select
        (select count(*) from filtered),
        coalesce((select array_agg(id) from page_rows), '{}'::bigint[])
    into v_count, v_ids;

    return jsonb_build_object(
        'count', v_count,
        'page', v_page,
        'page_size', v_size,
        'results', public._songs_payload(v_ids)
    );
end;
$$;

create or replace function public.admin_song_detail(p_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    v_result jsonb;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select public._song_payload(p_id) into v_result;
    if v_result is null then
        raise exception 'Song not found';
    end if;
    return v_result;
end;
$$;

-- Apply a SongSerializer-shaped jsonb payload onto an insert/update.
create or replace function public._apply_song_payload(p_data jsonb, p_artist out bigint, p_primary_genre out bigint)
returns record
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    p_artist := nullif(p_data ->> 'artist', '')::bigint;
    if p_artist is null or not exists (select 1 from public.artists where id = p_artist) then
        raise exception 'artist: Invalid pk "%" - object does not exist.', p_data ->> 'artist';
    end if;
    p_primary_genre := nullif(p_data ->> 'primary_genre', '')::bigint;
    if p_primary_genre is not null
       and not exists (select 1 from public.genres where id = p_primary_genre) then
        raise exception 'primary_genre: Invalid pk "%" - object does not exist.', p_data ->> 'primary_genre';
    end if;
end;
$$;

create or replace function public.admin_song_create(p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_artist bigint;
    v_genre bigint;
    v_id bigint;
    v_secondary bigint[];
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if coalesce(p_data ->> 'title', '') = '' then
        raise exception 'title: This field is required.';
    end if;
    if coalesce(p_data ->> 'provider_video_id', '') = '' then
        raise exception 'provider_video_id: This field is required.';
    end if;

    select * into v_artist, v_genre from public._apply_song_payload(p_data);

    insert into public.songs (
        title, title_ne, romanized_title, artist_id, featured_artists, composer,
        lyricist, album, film_or_source, release_year, language, primary_genre_id,
        mood_tags, duration_seconds, artwork_url, playback_provider,
        provider_video_id, provider_url, source_url, attribution,
        metadata_verification_status, publication_status, is_featured, featured_order
    ) values (
        p_data ->> 'title',
        coalesce(p_data ->> 'title_ne', ''),
        coalesce(p_data ->> 'romanized_title', ''),
        v_artist,
        coalesce(p_data ->> 'featured_artists', ''),
        coalesce(p_data ->> 'composer', ''),
        coalesce(p_data ->> 'lyricist', ''),
        coalesce(p_data ->> 'album', ''),
        coalesce(p_data ->> 'film_or_source', ''),
        nullif(p_data ->> 'release_year', '')::integer,
        coalesce(p_data ->> 'language', 'Nepali'),
        v_genre,
        coalesce(p_data -> 'mood_tags', '[]'::jsonb),
        nullif(p_data ->> 'duration_seconds', '')::integer,
        coalesce(p_data ->> 'artwork_url', ''),
        coalesce(p_data ->> 'playback_provider', 'youtube'),
        p_data ->> 'provider_video_id',
        coalesce(p_data ->> 'provider_url', ''),
        coalesce(p_data ->> 'source_url', ''),
        coalesce(p_data ->> 'attribution', ''),
        coalesce(p_data ->> 'metadata_verification_status', 'demo'),
        coalesce(p_data ->> 'publication_status', 'published'),
        coalesce((p_data ->> 'is_featured')::boolean, false),
        coalesce(nullif(p_data ->> 'featured_order', '')::integer, 0)
    )
    returning id into v_id;

    -- Secondary genres, excluding the primary (mirrors the old serializer).
    select coalesce(array_agg(distinct g.id), '{}'::bigint[])
    into v_secondary
    from jsonb_array_elements_text(coalesce(p_data -> 'secondary_genres', '[]'::jsonb)) elem
    join public.genres g on g.id = elem::bigint
    where g.id is distinct from v_genre;

    insert into public.song_secondary_genres (song_id, genre_id)
    select v_id, unnest(v_secondary)
    on conflict do nothing;

    perform public._audit('SONG_CREATED', 'Song', v_id::text, public._song_payload(v_id));
    return public._song_payload(v_id);
end;
$$;

create or replace function public.admin_song_update(p_id bigint, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_artist bigint;
    v_genre bigint;
    v_secondary bigint[];
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if not exists (select 1 from public.songs where id = p_id) then
        raise exception 'Song not found';
    end if;

    if p_data ? 'artist' or p_data ? 'primary_genre' then
        select * into v_artist, v_genre from public._apply_song_payload(
            jsonb_build_object(
                'artist', coalesce(p_data ->> 'artist',
                    (select artist_id::text from public.songs where id = p_id)),
                'primary_genre', coalesce(p_data ->> 'primary_genre',
                    (select primary_genre_id::text from public.songs where id = p_id))
            )
        );
    end if;

    update public.songs set
        title = coalesce(p_data ->> 'title', title),
        title_ne = coalesce(p_data ->> 'title_ne', title_ne),
        romanized_title = coalesce(p_data ->> 'romanized_title', romanized_title),
        artist_id = case when p_data ? 'artist' then v_artist else artist_id end,
        featured_artists = coalesce(p_data ->> 'featured_artists', featured_artists),
        composer = coalesce(p_data ->> 'composer', composer),
        lyricist = coalesce(p_data ->> 'lyricist', lyricist),
        album = coalesce(p_data ->> 'album', album),
        film_or_source = coalesce(p_data ->> 'film_or_source', film_or_source),
        release_year = case when p_data ? 'release_year'
                            then nullif(p_data ->> 'release_year', '')::integer
                            else release_year end,
        language = coalesce(p_data ->> 'language', language),
        primary_genre_id = case when p_data ? 'primary_genre' then v_genre else primary_genre_id end,
        mood_tags = case when p_data ? 'mood_tags'
                         then coalesce(p_data -> 'mood_tags', '[]'::jsonb)
                         else mood_tags end,
        duration_seconds = case when p_data ? 'duration_seconds'
                                then nullif(p_data ->> 'duration_seconds', '')::integer
                                else duration_seconds end,
        artwork_url = coalesce(p_data ->> 'artwork_url', artwork_url),
        playback_provider = coalesce(p_data ->> 'playback_provider', playback_provider),
        provider_video_id = coalesce(p_data ->> 'provider_video_id', provider_video_id),
        provider_url = coalesce(p_data ->> 'provider_url', provider_url),
        source_url = coalesce(p_data ->> 'source_url', source_url),
        attribution = coalesce(p_data ->> 'attribution', attribution),
        metadata_verification_status = coalesce(p_data ->> 'metadata_verification_status', metadata_verification_status),
        publication_status = coalesce(p_data ->> 'publication_status', publication_status),
        is_featured = case when p_data ? 'is_featured'
                           then coalesce((p_data ->> 'is_featured')::boolean, is_featured)
                           else is_featured end,
        featured_order = case when p_data ? 'featured_order'
                              then coalesce(nullif(p_data ->> 'featured_order', '')::integer, featured_order)
                              else featured_order end
    where id = p_id;

    if p_data ? 'secondary_genres' then
        select coalesce(array_agg(distinct g.id), '{}'::bigint[])
        into v_secondary
        from jsonb_array_elements_text(coalesce(p_data -> 'secondary_genres', '[]'::jsonb)) elem
        join public.genres g on g.id = elem::bigint
        where g.id is distinct from coalesce(v_genre, (select primary_genre_id from public.songs where id = p_id));

        delete from public.song_secondary_genres where song_id = p_id;
        insert into public.song_secondary_genres (song_id, genre_id)
        select p_id, unnest(v_secondary)
        on conflict do nothing;
    end if;

    perform public._audit('SONG_UPDATED', 'Song', p_id::text, p_data);
    return public._song_payload(p_id);
end;
$$;

create or replace function public.admin_song_unpublish(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_title text;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    update public.songs set publication_status = 'taken_down'
    where id = p_id
    returning title into v_title;

    if v_title is null then
        raise exception 'Song not found';
    end if;

    perform public._audit('SONG_UNPUBLISHED', 'Song', p_id::text, jsonb_build_object('reason', 'Admin action'));
    return jsonb_build_object('message', 'Song ' || v_title || ' unpublished.');
end;
$$;

-- ---------------------------------------------------------------------------
-- Bulk song operations (all-or-nothing, preview support, audit trail)
-- ---------------------------------------------------------------------------

create or replace function public._bulk_target_ids(p_payload jsonb)
returns bigint[]
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    v_ids bigint[];
    f jsonb := coalesce(p_payload -> 'filter', '{}'::jsonb);
begin
    if p_payload ? 'ids' and jsonb_array_length(p_payload -> 'ids') > 0 then
        begin
            select coalesce(array_agg(elem::bigint), '{}'::bigint[])
            into v_ids
            from jsonb_array_elements_text(p_payload -> 'ids') elem;
        exception when invalid_text_representation then
            raise exception 'ids must be a list of integers';
        end;
        return (select coalesce(array_agg(id), '{}'::bigint[]) from public.songs where id = any (v_ids));
    elsif f <> '{}'::jsonb then
        return (
            select coalesce(array_agg(s.id), '{}'::bigint[])
            from public.songs s
            left join public.artists a on a.id = s.artist_id
            where (
                coalesce(f ->> 'search', '') = '' or
                s.title ilike '%' || (f ->> 'search') || '%' or
                s.title_ne ilike '%' || (f ->> 'search') || '%' or
                s.romanized_title ilike '%' || (f ->> 'search') || '%' or
                a.display_name ilike '%' || (f ->> 'search') || '%' or
                a.display_name_ne ilike '%' || (f ->> 'search') || '%' or
                s.album ilike '%' || (f ->> 'search') || '%' or
                s.composer ilike '%' || (f ->> 'search') || '%' or
                s.lyricist ilike '%' || (f ->> 'search') || '%' or
                s.provider_video_id ilike '%' || (f ->> 'search') || '%'
            )
            and (coalesce(f ->> 'status', '') = '' or s.publication_status = f ->> 'status')
            and (
                coalesce(f ->> 'genre', '') = '' or
                (f ->> 'genre') ~ '^[0-9]+$' and (
                    s.primary_genre_id = (f ->> 'genre')::bigint or
                    s.id in (select song_id from public.song_secondary_genres where genre_id = (f ->> 'genre')::bigint)
                ) or
                (f ->> 'genre') !~ '^[0-9]+$' and (
                    s.primary_genre_id in (select id from public.genres where slug = f ->> 'genre') or
                    s.id in (select ss.song_id from public.song_secondary_genres ss
                             join public.genres g on g.id = ss.genre_id where g.slug = f ->> 'genre')
                )
            )
            and (coalesce(f ->> 'category', '') = '' or
                 s.primary_genre_id in (select id from public.genres where category = f ->> 'category'))
            and (coalesce(f ->> 'artist', '') = '' or
                 ((f ->> 'artist') ~ '^[0-9]+$' and s.artist_id = (f ->> 'artist')::bigint))
            and (coalesce(f ->> 'language', '') = '' or lower(s.language) = lower(f ->> 'language'))
            and (coalesce(f ->> 'decade', '') = '' or s.decade = f ->> 'decade')
            and (coalesce(f ->> 'verification', '') = '' or s.metadata_verification_status = f ->> 'verification')
        );
    else
        raise exception 'Provide ''ids'' or a ''filter'' object — refusing to touch the whole catalog blindly.';
    end if;
end;
$$;

create or replace function public.admin_songs_bulk(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_action text := coalesce(p_payload ->> 'action', '');
    v_preview boolean := coalesce((p_payload ->> 'preview')::boolean, false);
    v_ids bigint[];
    v_affected integer := 0;
    v_result jsonb;
    v_genre_id bigint;
    v_station_id bigint;
    v_value text;
    v_target_category text;
    v_source_category text;
    v_fallback_genre bigint;
    v_mapping jsonb;
    v_current_genre bigint;
    v_new_genre bigint;
    v_sample jsonb;
    v_existing bigint[];
    v_links bigint;
    v_position integer;
    v_map record;
    sid bigint;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    if v_action not in (
        'delete', 'set_status', 'set_verification', 'move_genre', 'move_category',
        'set_language', 'set_decade', 'assign_artist', 'reset_play_counts',
        'add_to_station', 'remove_from_station'
    ) then
        raise exception 'Unknown action ''%''', v_action;
    end if;

    v_ids := public._bulk_target_ids(p_payload);
    if array_length(v_ids, 1) is null then
        raise exception 'No songs matched the request';
    end if;

    if v_action = 'delete' then
        select count(*) into v_links from public.station_songs where song_id = any (v_ids);
        v_result := jsonb_build_object(
            'action', 'delete',
            'affected', array_length(v_ids, 1),
            'station_links_removed', v_links,
            'favorites_removed', (select count(*) from public.favorites where song_id = any (v_ids)),
            'playback_events_orphaned', (select count(*) from public.playback_events where song_id = any (v_ids)),
            'sample_titles', (
                select coalesce(jsonb_agg(title), '[]'::jsonb)
                from (select title from public.songs where id = any (v_ids) order by id limit 5) t
            ),
            'preview', v_preview
        );
        if not v_preview then
            delete from public.songs where id = any (v_ids);
        end if;
        return v_result;
    end if;

    if v_action in ('set_status', 'set_verification', 'set_language', 'set_decade', 'reset_play_counts') then
        v_value := coalesce(p_payload ->> 'value', '');
        if v_value = '' then
            raise exception '''value'' is required for this action';
        end if;
    end if;

    if v_action = 'set_status' then
        if v_value not in ('published', 'draft', 'disputed', 'taken_down') then
            raise exception 'Invalid publication status ''%''', v_value;
        end if;
        if not v_preview then
            update public.songs set publication_status = v_value where id = any (v_ids);
        end if;
        v_affected := array_length(v_ids, 1);
        v_result := jsonb_build_object('action', v_action, 'value', v_value, 'affected', v_affected, 'preview', v_preview);

    elsif v_action = 'set_verification' then
        if v_value not in ('verified', 'community_submitted', 'demo') then
            raise exception 'Invalid verification status ''%''', v_value;
        end if;
        if not v_preview then
            update public.songs set metadata_verification_status = v_value where id = any (v_ids);
        end if;
        v_affected := array_length(v_ids, 1);
        v_result := jsonb_build_object('action', v_action, 'value', v_value, 'affected', v_affected, 'preview', v_preview);

    elsif v_action = 'move_genre' then
        v_genre_id := nullif(p_payload ->> 'genre_id', '')::bigint;
        if v_genre_id is null or not exists (select 1 from public.genres where id = v_genre_id) then
            raise exception 'Genre #% does not exist', coalesce(v_genre_id, 0);
        end if;

        select count(*) into v_affected from public.songs
        where id = any (v_ids) and primary_genre_id is distinct from v_genre_id;
        if not v_preview then
            update public.songs set primary_genre_id = v_genre_id
            where id = any (v_ids) and primary_genre_id is distinct from v_genre_id;
        end if;
        v_result := jsonb_build_object(
            'action', v_action,
            'genre', (select jsonb_build_object('id', id, 'name', name, 'category', category)
                      from public.genres where id = v_genre_id),
            'affected', v_affected,
            'already_in_genre', array_length(v_ids, 1) - v_affected,
            'preview', v_preview
        );

    elsif v_action = 'move_category' then
        v_source_category := coalesce(p_payload ->> 'source_category', '');
        v_target_category := coalesce(p_payload ->> 'target_category', '');
        if v_target_category = '' then
            raise exception '''target_category'' is required for this action';
        end if;
        v_fallback_genre := nullif(p_payload ->> 'genre_id', '')::bigint;
        v_mapping := coalesce(p_payload -> 'mapping', '{}'::jsonb);

        if not exists (select 1 from public.genres where category = v_target_category) then
            raise exception 'Category ''%'' has no genres — create one first', v_target_category;
        end if;
        if v_fallback_genre is not null
           and not exists (select 1 from public.genres where id = v_fallback_genre and category = v_target_category) then
            raise exception 'Fallback genre #% does not exist in category "%"', v_fallback_genre, v_target_category;
        end if;

        -- Every mapping value must be a genre inside the target category.
        for v_map in select key, value from jsonb_each_text(v_mapping)
        loop
            begin
                if not exists (
                    select 1 from public.genres
                    where id = v_map.value::bigint and category = v_target_category
                ) then
                    raise exception 'Genre #% is not in category "%"', v_map.value::bigint, v_target_category;
                end if;
            exception when invalid_text_representation then
                raise exception 'mapping values must be genre ids';
            end;
        end loop;

        for sid, v_current_genre, v_new_genre in
            select
                s.id,
                s.primary_genre_id,
                case
                    when s.primary_genre_id is not null and
                         (select category from public.genres where id = s.primary_genre_id) = v_target_category
                        then s.primary_genre_id
                    when v_mapping ? coalesce(s.primary_genre_id::text, '')
                        then (v_mapping ->> coalesce(s.primary_genre_id::text, ''))::bigint
                    else v_fallback_genre
                end
            from public.songs s
            where s.id = any (v_ids)
        loop
            if v_new_genre is null or not exists (
                select 1 from public.genres where id = v_new_genre and category = v_target_category
            ) then
                continue;
            end if;
            if v_current_genre is not null
               and (select category from public.genres where id = v_current_genre) = v_target_category then
                continue;
            end if;
            v_affected := v_affected + 1;
            if not v_preview then
                update public.songs set primary_genre_id = v_new_genre where id = sid;
                delete from public.song_secondary_genres where song_id = sid and genre_id = v_current_genre;
                insert into public.song_secondary_genres (song_id, genre_id)
                values (sid, v_new_genre) on conflict do nothing;
            end if;
        end loop;

        v_result := jsonb_build_object(
            'action', v_action,
            'source_category', case when v_source_category = '' then '(from selection)' else v_source_category end,
            'target_category', v_target_category,
            'affected', v_affected,
            'moved_to_fallback_genre', 0,
            'skipped', array_length(v_ids, 1) - v_affected,
            'preview', v_preview
        );

    elsif v_action = 'set_language' then
        if length(btrim(v_value)) > 50 then
            raise exception 'Language must be 50 characters or fewer';
        end if;
        if not v_preview then
            update public.songs set language = btrim(v_value) where id = any (v_ids);
        end if;
        v_result := jsonb_build_object('action', v_action, 'value', btrim(v_value), 'affected', array_length(v_ids, 1), 'preview', v_preview);

    elsif v_action = 'set_decade' then
        if v_value !~ '^\d{4}s$' then
            raise exception 'Decade must look like ''1980s''';
        end if;
        if not v_preview then
            update public.songs set decade = v_value where id = any (v_ids);
        end if;
        v_result := jsonb_build_object('action', v_action, 'value', v_value, 'affected', array_length(v_ids, 1), 'preview', v_preview);

    elsif v_action = 'assign_artist' then
        v_value := coalesce(p_payload ->> 'artist_id', '');
        if v_value = '' then
            raise exception '''artist_id'' is required for this action';
        end if;
        v_genre_id := nullif(v_value, '')::bigint;
        if not exists (select 1 from public.artists where id = v_genre_id) then
            raise exception 'Artist #% does not exist', v_genre_id;
        end if;
        if not v_preview then
            update public.songs set artist_id = v_genre_id where id = any (v_ids);
        end if;
        v_result := jsonb_build_object(
            'action', v_action,
            'artist', (select jsonb_build_object('id', id, 'name', display_name)
                       from public.artists where id = v_genre_id),
            'affected', array_length(v_ids, 1),
            'preview', v_preview
        );

    elsif v_action = 'reset_play_counts' then
        begin
            v_affected := least(coalesce((p_payload ->> 'value')::integer, 0), 2147483647);
        exception when invalid_text_representation then
            raise exception 'value must be an integer play count';
        end;
        v_affected := greatest(v_affected, 0);
        if not v_preview then
            update public.songs set play_count = v_affected where id = any (v_ids);
        end if;
        v_result := jsonb_build_object('action', v_action, 'value', v_affected, 'affected', array_length(v_ids, 1), 'preview', v_preview);

    elsif v_action in ('add_to_station', 'remove_from_station') then
        v_station_id := nullif(p_payload ->> 'station_id', '')::bigint;
        if v_station_id is null or not exists (select 1 from public.stations where id = v_station_id) then
            raise exception 'Station #% does not exist', coalesce(v_station_id, 0);
        end if;

        if v_action = 'add_to_station' then
            select coalesce(array_agg(song_id), '{}'::bigint[])
            into v_existing
            from public.station_songs where station_id = v_station_id and song_id = any (v_ids);

            select coalesce(max(position), 0) + 1 into v_position
            from public.station_songs where station_id = v_station_id;

            if not v_preview then
                foreach sid in array coalesce(
                    (select array_agg(x)
                     from (select unnest(v_ids) except select unnest(v_existing)) t(x)),
                    '{}'::bigint[]
                )
                loop
                    insert into public.station_songs (station_id, song_id, position)
                    values (v_station_id, sid, v_position)
                    on conflict do nothing;
                    v_position := v_position + 1;
                end loop;
            end if;

            select count(*) into v_links from public.station_songs
            where station_id = v_station_id and song_id = any (v_ids);

            v_result := jsonb_build_object(
                'action', v_action,
                'station', (select jsonb_build_object('id', id, 'title', title)
                            from public.stations where id = v_station_id),
                'affected', v_links - coalesce(array_length(v_existing, 1), 0),
                'already_in_station', coalesce(array_length(v_existing, 1), 0),
                'preview', v_preview
            );
        else
            select count(*) into v_links from public.station_songs
            where station_id = v_station_id and song_id = any (v_ids);
            if not v_preview then
                delete from public.station_songs
                where station_id = v_station_id and song_id = any (v_ids);
            end if;
            v_result := jsonb_build_object(
                'action', v_action,
                'station', (select jsonb_build_object('id', id, 'title', title)
                            from public.stations where id = v_station_id),
                'affected', v_links,
                'preview', v_preview
            );
        end if;
    end if;

    -- Shared summary fields, mirroring the Django helpers.
    select coalesce(jsonb_agg(s.title), '[]'::jsonb)
    into v_sample
    from (
        select title from public.songs where id = any (v_ids) order by id limit 5
    ) s;
    v_result := v_result || jsonb_build_object('sample_titles', v_sample);

    if not v_preview then
        perform public._audit(
            'SONG_BULK_' || upper(v_action),
            'Song',
            coalesce((v_result ->> 'affected')::text, array_length(v_ids, 1)::text) || ' songs',
            v_result - 'sample_titles'
        );
    end if;

    return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Genre management
-- ---------------------------------------------------------------------------

create or replace function public.admin_genres()
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
                'songs_count', (select count(*) from public.songs s where s.primary_genre_id = g.id)
            ) as payload
        from public.genres g
    ) t;
$$;

create or replace function public.admin_genre_create(p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_name text := btrim(coalesce(p_data ->> 'name', ''));
    v_category text := coalesce(nullif(p_data ->> 'category', ''), 'popular');
    v_slug text;
    v_id bigint;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if v_name = '' then
        raise exception 'name: This field is required.';
    end if;
    if exists (select 1 from public.genres where lower(name) = lower(v_name)) then
        raise exception 'name: Genre with this name already exists.';
    end if;
    if not exists (select 1 from public.genre_categories where slug = v_category) then
        raise exception 'Unknown genre category ''%''. Create it under the admin Taxonomy tab first.', v_category;
    end if;

    v_slug := public._unique_slug(coalesce(public.slugify(v_name), 'genre'), 'genres', null);

    insert into public.genres (name, name_ne, slug, category, description, is_active)
    values (
        v_name,
        coalesce(p_data ->> 'name_ne', ''),
        v_slug,
        v_category,
        coalesce(p_data ->> 'description', ''),
        coalesce((p_data ->> 'is_active')::boolean, true)
    )
    returning id into v_id;

    perform public._audit('GENRE_CREATED', 'Genre', v_id::text, (
        select jsonb_build_object(
            'id', id, 'name', name, 'name_ne', name_ne, 'slug', slug,
            'category', category, 'description', description, 'is_active', is_active
        ) from public.genres where id = v_id
    ));

    return (
        select jsonb_build_object(
            'id', g.id, 'name', g.name, 'name_ne', g.name_ne, 'slug', g.slug,
            'category', g.category, 'description', g.description,
            'is_active', g.is_active, 'songs_count',
            (select count(*) from public.songs s where s.primary_genre_id = g.id)
        )
        from public.genres g where g.id = v_id
    );
end;
$$;

create or replace function public.admin_genre_update(p_id bigint, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_old public.genres;
    v_name text;
    v_category text;
    v_slug text;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select * into v_old from public.genres where id = p_id;
    if not found then
        raise exception 'Genre not found';
    end if;

    v_name := coalesce(btrim(p_data ->> 'name'), v_old.name);
    if exists (select 1 from public.genres where lower(name) = lower(v_name) and id <> p_id) then
        raise exception 'name: Genre with this name already exists.';
    end if;

    v_category := coalesce(nullif(p_data ->> 'category', ''), v_old.category);
    if not exists (select 1 from public.genre_categories where slug = v_category) then
        raise exception 'Unknown genre category ''%''. Create it under the admin Taxonomy tab first.', v_category;
    end if;

    if p_data ? 'slug' and coalesce(p_data ->> 'slug', '') <> '' then
        v_slug := public.slugify(p_data ->> 'slug');
        if v_slug = '' then
            raise exception 'slug: Ensure this value is at least 1 character(s) and contains no invalid characters.';
        end if;
        if exists (select 1 from public.genres where slug = v_slug and id <> p_id) then
            raise exception 'slug: Genre with this slug already exists.';
        end if;
    elsif v_name is distinct from v_old.name then
        v_slug := public._unique_slug(coalesce(public.slugify(v_name), 'genre'), 'genres', p_id);
    else
        v_slug := v_old.slug;
    end if;

    update public.genres set
        name = v_name,
        name_ne = coalesce(p_data ->> 'name_ne', name_ne),
        slug = v_slug,
        category = v_category,
        description = coalesce(p_data ->> 'description', description),
        is_active = coalesce((p_data ->> 'is_active')::boolean, is_active)
    where id = p_id;

    perform public._audit('GENRE_UPDATED', 'Genre', p_id::text, p_data);

    return (
        select jsonb_build_object(
            'id', g.id, 'name', g.name, 'name_ne', g.name_ne, 'slug', g.slug,
            'category', g.category, 'description', g.description,
            'is_active', g.is_active, 'songs_count',
            (select count(*) from public.songs s where s.primary_genre_id = g.id)
        )
        from public.genres g where g.id = p_id
    );
end;
$$;

create or replace function public.admin_genre_delete(p_id bigint, p_reassign_to bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_genre public.genres;
    v_primary integer;
    v_secondary integer;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select * into v_genre from public.genres where id = p_id;
    if not found then
        raise exception 'Genre not found';
    end if;

    select count(*) into v_primary from public.songs where primary_genre_id = p_id;
    select count(*) into v_secondary from public.song_secondary_genres where genre_id = p_id;

    if v_primary > 0 or v_secondary > 0 then
        if p_reassign_to is null then
            raise exception 'Genre ''%'' is still used by % primary and % secondary song links. Pass ?reassign_to=<genre_id> to move them before deleting.',
                v_genre.name, v_primary, v_secondary;
        end if;
        if p_reassign_to = p_id or not exists (select 1 from public.genres where id = p_reassign_to) then
            raise exception 'Reassign target genre not found';
        end if;

        update public.songs set primary_genre_id = p_reassign_to where primary_genre_id = p_id;
        insert into public.song_secondary_genres (song_id, genre_id)
        select song_id, p_reassign_to from public.song_secondary_genres where genre_id = p_id
        on conflict do nothing;
        delete from public.song_secondary_genres where genre_id = p_id;
    end if;

    delete from public.genres where id = p_id;

    perform public._audit('GENRE_DELETED', 'Genre', p_id::text, jsonb_build_object(
        'name', v_genre.name,
        'reassigned_primary', v_primary,
        'reassigned_secondary', v_secondary
    ));
    return jsonb_build_object('message', 'Genre ''' || v_genre.name || ''' deleted.');
end;
$$;

-- ---------------------------------------------------------------------------
-- Artist management
-- ---------------------------------------------------------------------------

create or replace function public.admin_artists(
    p_search text default '',
    p_verification text default ''
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select coalesce(jsonb_agg(payload order by display_name), '[]'::jsonb)
    from (
        select
            a.display_name,
            jsonb_build_object(
                'id', a.id,
                'display_name', a.display_name,
                'display_name_ne', a.display_name_ne,
                'biography', a.biography,
                'biography_ne', a.biography_ne,
                'profile_image', a.profile_image,
                'verification_status', a.verification_status,
                'songs_count', (select count(*) from public.songs s where s.artist_id = a.id),
                'created_at', a.created_at
            ) as payload
        from public.artists a
        where (
            coalesce(p_search, '') = ''
            or a.display_name ilike '%' || p_search || '%'
            or a.display_name_ne ilike '%' || p_search || '%'
        )
        and (coalesce(p_verification, '') = '' or a.verification_status = p_verification)
    ) t;
$$;

create or replace function public.admin_artist_create(p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_id bigint;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if coalesce(p_data ->> 'display_name', '') = '' then
        raise exception 'display_name: This field is required.';
    end if;

    insert into public.artists (display_name, display_name_ne, biography, biography_ne, profile_image, verification_status)
    values (
        p_data ->> 'display_name',
        coalesce(p_data ->> 'display_name_ne', ''),
        coalesce(p_data ->> 'biography', ''),
        coalesce(p_data ->> 'biography_ne', ''),
        coalesce(p_data ->> 'profile_image', ''),
        coalesce(p_data ->> 'verification_status', 'unverified')
    )
    returning id into v_id;

    perform public._audit('ARTIST_CREATED', 'Artist', v_id::text, p_data);

    return (
        select jsonb_build_object(
            'id', a.id, 'display_name', a.display_name, 'display_name_ne', a.display_name_ne,
            'biography', a.biography, 'biography_ne', a.biography_ne,
            'profile_image', a.profile_image, 'verification_status', a.verification_status,
            'songs_count', (select count(*) from public.songs s where s.artist_id = a.id),
            'created_at', a.created_at
        )
        from public.artists a where a.id = v_id
    );
end;
$$;

create or replace function public.admin_artist_update(p_id bigint, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if not exists (select 1 from public.artists where id = p_id) then
        raise exception 'Artist not found';
    end if;

    update public.artists set
        display_name = coalesce(p_data ->> 'display_name', display_name),
        display_name_ne = coalesce(p_data ->> 'display_name_ne', display_name_ne),
        biography = coalesce(p_data ->> 'biography', biography),
        biography_ne = coalesce(p_data ->> 'biography_ne', biography_ne),
        profile_image = coalesce(p_data ->> 'profile_image', profile_image),
        verification_status = coalesce(p_data ->> 'verification_status', verification_status),
        updated_at = now()
    where id = p_id;

    perform public._audit('ARTIST_UPDATED', 'Artist', p_id::text, p_data);

    return (
        select jsonb_build_object(
            'id', a.id, 'display_name', a.display_name, 'display_name_ne', a.display_name_ne,
            'biography', a.biography, 'biography_ne', a.biography_ne,
            'profile_image', a.profile_image, 'verification_status', a.verification_status,
            'songs_count', (select count(*) from public.songs s where s.artist_id = a.id),
            'created_at', a.created_at
        )
        from public.artists a where a.id = p_id
    );
end;
$$;

create or replace function public.admin_artist_delete(p_id bigint, p_reassign_to bigint default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_artist public.artists;
    v_song_count integer;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select * into v_artist from public.artists where id = p_id;
    if not found then
        raise exception 'Artist not found';
    end if;

    select count(*) into v_song_count from public.songs where artist_id = p_id;
    if v_song_count > 0 then
        if p_reassign_to is null then
            raise exception 'Artist ''%'' has % songs. Pass ?reassign_to=<artist_id> to move them before deleting (this is also how you merge two artists).',
                v_artist.display_name, v_song_count;
        end if;
        if p_reassign_to = p_id or not exists (select 1 from public.artists where id = p_reassign_to) then
            raise exception 'Reassign target artist not found';
        end if;
        update public.songs set artist_id = p_reassign_to where artist_id = p_id;
    end if;

    delete from public.artists where id = p_id;

    perform public._audit('ARTIST_DELETED', 'Artist', p_id::text, jsonb_build_object(
        'display_name', v_artist.display_name,
        'reassigned_songs', v_song_count
    ));
    return jsonb_build_object('message', 'Artist ''' || v_artist.display_name || ''' deleted.');
end;
$$;

-- ---------------------------------------------------------------------------
-- Station management
-- ---------------------------------------------------------------------------

create or replace function public.admin_stations()
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
                'id', st.id, 'slug', st.slug, 'title', st.title, 'title_ne', st.title_ne,
                'tagline', st.tagline, 'tagline_ne', st.tagline_ne,
                'description', st.description, 'description_ne', st.description_ne,
                'cover_image', st.cover_image, 'theme_color', st.theme_color,
                'ambient_type', st.ambient_type, 'is_featured', st.is_featured,
                'is_active', st.is_active, 'display_order', st.display_order,
                'songs_count', (select count(*) from public.station_songs ss where ss.station_id = st.id)
            ) as payload
        from public.stations st
    ) t;
$$;

create or replace function public.admin_station_create(p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_title text := btrim(coalesce(p_data ->> 'title', ''));
    v_slug text;
    v_order integer;
    v_id bigint;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if v_title = '' then
        raise exception '''title'' is required';
    end if;

    begin
        v_order := coalesce(nullif(p_data ->> 'display_order', '')::integer, 0);
    exception when invalid_text_representation then
        raise exception 'display_order must be an integer';
    end;

    v_slug := public._unique_slug(
        coalesce(nullif(public.slugify(coalesce(nullif(p_data ->> 'slug', ''), v_title)), ''), 'station'),
        'stations', null
    );

    insert into public.stations (
        slug, title, title_ne, tagline, tagline_ne, description, description_ne,
        cover_image, theme_color, ambient_type, is_featured, is_active, display_order
    ) values (
        v_slug, v_title,
        btrim(coalesce(p_data ->> 'title_ne', '')),
        btrim(coalesce(p_data ->> 'tagline', '')),
        btrim(coalesce(p_data ->> 'tagline_ne', '')),
        coalesce(p_data ->> 'description', ''),
        coalesce(p_data ->> 'description_ne', ''),
        coalesce(p_data ->> 'cover_image', ''),
        coalesce(nullif(p_data ->> 'theme_color', ''), '#C7A66A'),
        coalesce(nullif(p_data ->> 'ambient_type', ''), 'vintage_crackle'),
        coalesce((p_data ->> 'is_featured')::boolean, true),
        coalesce((p_data ->> 'is_active')::boolean, true),
        v_order
    )
    returning id into v_id;

    perform public._audit('STATION_CREATED', 'Station', v_id::text, (
        select jsonb_build_object(
            'id', id, 'slug', slug, 'title', title, 'title_ne', title_ne,
            'tagline', tagline, 'tagline_ne', tagline_ne, 'description', description,
            'description_ne', description_ne, 'cover_image', cover_image,
            'theme_color', theme_color, 'ambient_type', ambient_type,
            'is_featured', is_featured, 'is_active', is_active,
            'display_order', display_order, 'songs_count', 0
        ) from public.stations where id = v_id
    ));

    return (
        select jsonb_build_object(
            'id', id, 'slug', slug, 'title', title, 'title_ne', title_ne,
            'tagline', tagline, 'tagline_ne', tagline_ne, 'description', description,
            'description_ne', description_ne, 'cover_image', cover_image,
            'theme_color', theme_color, 'ambient_type', ambient_type,
            'is_featured', is_featured, 'is_active', is_active,
            'display_order', display_order, 'songs_count', 0
        )
        from public.stations where id = v_id
    );
end;
$$;

create or replace function public.admin_station_update(p_id bigint, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if not exists (select 1 from public.stations where id = p_id) then
        raise exception 'Station not found';
    end if;

    update public.stations set
        title = coalesce(nullif(p_data ->> 'title', ''), title),
        title_ne = coalesce(p_data ->> 'title_ne', title_ne),
        tagline = coalesce(p_data ->> 'tagline', tagline),
        tagline_ne = coalesce(p_data ->> 'tagline_ne', tagline_ne),
        description = coalesce(p_data ->> 'description', description),
        description_ne = coalesce(p_data ->> 'description_ne', description_ne),
        cover_image = coalesce(p_data ->> 'cover_image', cover_image),
        theme_color = coalesce(p_data ->> 'theme_color', theme_color),
        ambient_type = coalesce(p_data ->> 'ambient_type', ambient_type),
        is_featured = coalesce((p_data ->> 'is_featured')::boolean, is_featured),
        is_active = coalesce((p_data ->> 'is_active')::boolean, is_active),
        display_order = coalesce(nullif(p_data ->> 'display_order', '')::integer, display_order),
        updated_at = now()
    where id = p_id;

    perform public._audit('STATION_UPDATED', 'Station', p_id::text, p_data);

    return (
        select jsonb_build_object(
            'id', id, 'slug', slug, 'title', title, 'title_ne', title_ne,
            'tagline', tagline, 'tagline_ne', tagline_ne, 'description', description,
            'description_ne', description_ne, 'cover_image', cover_image,
            'theme_color', theme_color, 'ambient_type', ambient_type,
            'is_featured', is_featured, 'is_active', is_active,
            'display_order', display_order, 'songs_count',
            (select count(*) from public.station_songs ss where ss.station_id = p_id)
        )
        from public.stations where id = p_id
    );
end;
$$;

create or replace function public.admin_station_delete(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_title text;
    v_links integer;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select title into v_title from public.stations where id = p_id;
    if v_title is null then
        raise exception 'Station not found';
    end if;

    select count(*) into v_links from public.station_songs where station_id = p_id;
    delete from public.stations where id = p_id;

    perform public._audit('STATION_DELETED', 'Station', p_id::text, jsonb_build_object(
        'title', v_title,
        'station_links_removed', v_links
    ));
    return jsonb_build_object(
        'message', 'Station ''' || v_title || ''' deleted.',
        'station_links_removed', v_links
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Genre category registry
-- ---------------------------------------------------------------------------

create or replace function public.admin_genre_categories(p_include_inactive boolean default false)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    return public.get_genre_categories(p_include_inactive);
end;
$$;

create or replace function public.admin_genre_category_create(p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_name text := btrim(coalesce(p_data ->> 'name', ''));
    v_slug text;
    v_order integer;
    v_id bigint;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if v_name = '' then
        raise exception '''name'' is required';
    end if;
    if exists (select 1 from public.genre_categories where lower(name) = lower(v_name)) then
        raise exception 'A category named ''%'' already exists', v_name;
    end if;

    v_slug := public.slugify(coalesce(nullif(p_data ->> 'slug', ''), v_name));
    if v_slug = '' then
        raise exception 'Category slug could not be derived from the name';
    end if;
    if exists (select 1 from public.genre_categories where slug = v_slug) then
        raise exception 'Category slug ''%'' already exists', v_slug;
    end if;

    begin
        v_order := coalesce(nullif(p_data ->> 'display_order', '')::integer, 0);
    exception when invalid_text_representation then
        raise exception 'display_order must be an integer';
    end;

    insert into public.genre_categories (slug, name, name_ne, description, display_order, is_active)
    values (
        v_slug, v_name,
        btrim(coalesce(p_data ->> 'name_ne', '')),
        btrim(coalesce(p_data ->> 'description', '')),
        v_order,
        coalesce((p_data ->> 'is_active')::boolean, true)
    )
    returning id into v_id;

    perform public._audit('GENRE_CATEGORY_CREATED', 'GenreCategory', v_id::text, (
        select to_jsonb(c) from public.genre_categories c where c.id = v_id
    ));

    return (
        select jsonb_build_object(
            'id', cc.id, 'slug', cc.slug, 'name', cc.name, 'name_ne', cc.name_ne,
            'description', cc.description, 'display_order', cc.display_order,
            'is_active', cc.is_active, 'genres_count',
            (select count(*) from public.genres g where g.category = cc.slug),
            'songs_count', 0,
            'created_at', cc.created_at
        )
        from public.genre_categories cc where cc.id = v_id
    );
end;
$$;

create or replace function public.admin_genre_category_update(p_id bigint, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    c public.genre_categories;
    v_name text;
    v_slug text;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select * into c from public.genre_categories where id = p_id;
    if not found then
        raise exception 'Category not found';
    end if;

    v_name := c.name;
    if p_data ? 'name' then
        v_name := btrim(coalesce(p_data ->> 'name', ''));
        if v_name = '' then
            raise exception '''name'' cannot be empty';
        end if;
        if exists (select 1 from public.genre_categories where lower(name) = lower(v_name) and id <> p_id) then
            raise exception 'A category named ''%'' already exists', v_name;
        end if;
    end if;

    v_slug := c.slug;
    if p_data ? 'slug' then
        v_slug := public.slugify(p_data ->> 'slug');
        if v_slug = '' then
            raise exception '''slug'' cannot be empty';
        end if;
        if exists (select 1 from public.genre_categories where slug = v_slug and id <> p_id) then
            raise exception 'Category slug ''%'' already exists', v_slug;
        end if;
    end if;

    if p_data ? 'display_order' then
        begin
            perform coalesce(nullif(p_data ->> 'display_order', '')::integer);
        exception when invalid_text_representation then
            raise exception 'display_order must be an integer';
        end;
    end if;

    update public.genre_categories set
        name = v_name,
        slug = v_slug,
        name_ne = coalesce(p_data ->> 'name_ne', name_ne),
        description = coalesce(p_data ->> 'description', description),
        display_order = case when p_data ? 'display_order'
                             then coalesce(nullif(p_data ->> 'display_order', '')::integer, display_order)
                             else display_order end,
        is_active = coalesce((p_data ->> 'is_active')::boolean, is_active)
    where id = p_id;

    -- A renamed slug must follow the genres that live in it.
    if v_slug <> c.slug then
        update public.genres set category = v_slug where category = c.slug;
    end if;

    perform public._audit('GENRE_CATEGORY_UPDATED', 'GenreCategory', p_id::text, p_data || jsonb_build_object('old_slug', c.slug));

    return (
        select jsonb_build_object(
            'id', cc.id, 'slug', cc.slug, 'name', cc.name, 'name_ne', cc.name_ne,
            'description', cc.description, 'display_order', cc.display_order,
            'is_active', cc.is_active, 'genres_count',
            (select count(*) from public.genres g where g.category = cc.slug), 'songs_count', 0,
            'created_at', cc.created_at
        )
        from public.genre_categories cc where cc.id = p_id
    );
end;
$$;

create or replace function public.admin_genre_category_delete(p_id bigint, p_reassign_to text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    c public.genre_categories;
    v_genre_count integer;
    v_target_id bigint;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select * into c from public.genre_categories where id = p_id;
    if not found then
        raise exception 'Category not found';
    end if;

    if (select count(*) from public.genre_categories) <= 1 then
        raise exception 'At least one genre category must remain.';
    end if;

    select count(*) into v_genre_count from public.genres where category = c.slug;
    if v_genre_count > 0 then
        select id into v_target_id from public.genre_categories
        where slug = public.slugify(coalesce(p_reassign_to, '')) and id <> p_id;

        if v_target_id is null then
            raise exception 'Category ''%'' still holds % genre(s). Pass ?reassign_to=<category_slug> to move them first. Options: %',
                c.name,
                v_genre_count,
                (select string_agg(slug, ', ' order by display_order)
                 from public.genre_categories where id <> p_id);
        end if;

        update public.genres set category = (select slug from public.genre_categories where id = v_target_id)
        where category = c.slug;
    end if;

    delete from public.genre_categories where id = p_id;

    perform public._audit('GENRE_CATEGORY_DELETED', 'GenreCategory', p_id::text, jsonb_build_object(
        'name', c.name,
        'slug', c.slug,
        'genres_moved', v_genre_count,
        'reassigned_to', p_reassign_to
    ));
    return jsonb_build_object('message', 'Category ''' || c.name || ''' deleted.', 'genres_moved', v_genre_count);
end;
$$;

create or replace function public.admin_genre_categories_reorder(p_order jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    entry jsonb;
    v_updated integer := 0;
    v_ids text[] := '{}';
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if jsonb_typeof(p_order) <> 'array' then
        raise exception 'Send {''order'': [{''id'': 1, ''display_order'': 0}, ...]}';
    end if;

    for entry in select * from jsonb_array_elements(p_order)
    loop
        begin
            update public.genre_categories
            set display_order = (entry ->> 'display_order')::integer
            where id = (entry ->> 'id')::bigint;
            if found then
                v_updated := v_updated + 1;
                v_ids := v_ids || (entry ->> 'id');
            end if;
        exception when invalid_text_representation or numeric_value_out_of_range then
            raise exception 'Invalid order entry: %', entry;
        end;
    end loop;

    perform public._audit('GENRE_CATEGORY_REORDERED', 'GenreCategory', array_to_string(v_ids, ','), jsonb_build_object('order', p_order));
    return jsonb_build_object('message', 'Reordered ' || v_updated || ' categories.', 'updated', (
        select coalesce(jsonb_agg((e ->> 'id')::bigint), '[]'::jsonb)
        from jsonb_array_elements(p_order) e
    ));
end;
$$;

-- ---------------------------------------------------------------------------
-- Station queue
-- ---------------------------------------------------------------------------

create or replace function public._station_queue_rows(p_station_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select coalesce(jsonb_agg(
        jsonb_build_object(
            'position', ss.position,
            'song_id', s.id,
            'title', s.title,
            'title_ne', s.title_ne,
            'artist_name', a.display_name,
            'publication_status', s.publication_status,
            'artwork_url', case
                when s.artwork_url <> '' then s.artwork_url
                when s.provider_video_id <> '' then 'https://img.youtube.com/vi/' || s.provider_video_id || '/hqdefault.jpg'
                else '' end
        ) order by ss.position, ss.id
    ), '[]'::jsonb)
    from public.station_songs ss
    join public.songs s on s.id = ss.song_id
    left join public.artists a on a.id = s.artist_id
    where ss.station_id = p_station_id;
$$;

create or replace function public.admin_station_queue_get(p_station_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
    v_title text;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select title into v_title from public.stations where id = p_station_id;
    if v_title is null then
        raise exception 'Station not found';
    end if;

    return jsonb_build_object(
        'station_id', p_station_id,
        'station_title', v_title,
        'count', (select count(*) from public.station_songs where station_id = p_station_id),
        'queue', public._station_queue_rows(p_station_id)
    );
end;
$$;

create or replace function public.admin_station_queue_add(p_station_id bigint, p_song_ids bigint[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_title text;
    v_position integer;
    v_added bigint[] := '{}';
    v_skipped bigint[] := '{}';
    sid bigint;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select title into v_title from public.stations where id = p_station_id;
    if v_title is null then
        raise exception 'Station not found';
    end if;
    if p_song_ids is null or coalesce(array_length(p_song_ids, 1), 0) = 0 then
        raise exception 'Provide song_id or song_ids';
    end if;

    select coalesce(max(position), 0) + 1 into v_position
    from public.station_songs where station_id = p_station_id;

    foreach sid in array p_song_ids
    loop
        if not exists (select 1 from public.songs where id = sid) then
            v_skipped := v_skipped || sid;
        elsif exists (select 1 from public.station_songs where station_id = p_station_id and song_id = sid) then
            v_skipped := v_skipped || sid;
        else
            insert into public.station_songs (station_id, song_id, position)
            values (p_station_id, sid, v_position);
            v_added := v_added || sid;
            v_position := v_position + 1;
        end if;
    end loop;

    if coalesce(array_length(v_added, 1), 0) > 0 then
        perform public._audit('STATION_QUEUE_ADD', 'Station', p_station_id::text, jsonb_build_object(
            'added', to_jsonb(v_added),
            'skipped', to_jsonb(v_skipped)
        ));
    end if;

    return jsonb_build_object(
        'message', 'Added ' || coalesce(array_length(v_added, 1), 0) || ' song(s) to "' || v_title || '".',
        'added', to_jsonb(v_added),
        'skipped', to_jsonb(v_skipped),
        'queue', public._station_queue_rows(p_station_id)
    );
end;
$$;

create or replace function public.admin_station_queue_reorder(p_station_id bigint, p_order bigint[])
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_position integer := 0;
    sid bigint;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if not exists (select 1 from public.stations where id = p_station_id) then
        raise exception 'Station not found';
    end if;
    if p_order is null then
        raise exception 'Send {''order'': [song_id, ...]}';
    end if;

    foreach sid in array p_order
    loop
        update public.station_songs
        set position = v_position
        where station_id = p_station_id and song_id = sid and position <> v_position;
        v_position := v_position + 1;
    end loop;

    perform public._audit('STATION_QUEUE_REORDER', 'Station', p_station_id::text, jsonb_build_object('order', to_jsonb(p_order)));
    return jsonb_build_object('message', 'Queue reordered.', 'queue', public._station_queue_rows(p_station_id));
end;
$$;

create or replace function public.admin_station_queue_remove(p_station_id bigint, p_song_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_deleted integer;
    r record;
    v_position integer := 0;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;
    if not exists (select 1 from public.stations where id = p_station_id) then
        raise exception 'Station not found';
    end if;

    delete from public.station_songs
    where station_id = p_station_id and song_id = p_song_id
    returning 1 into v_deleted;

    if coalesce(v_deleted, 0) = 0 then
        raise exception 'That song is not in this station queue.';
    end if;

    for r in
        select id from public.station_songs
        where station_id = p_station_id
        order by position, id
    loop
        update public.station_songs set position = v_position where id = r.id;
        v_position := v_position + 1;
    end loop;

    perform public._audit('STATION_QUEUE_REMOVE', 'Station', p_station_id::text, jsonb_build_object('removed_song_id', p_song_id));
    return jsonb_build_object('message', 'Song removed from queue.', 'queue', public._station_queue_rows(p_station_id));
end;
$$;

-- ---------------------------------------------------------------------------
-- Takedown moderation + audit logs
-- ---------------------------------------------------------------------------

create or replace function public.admin_takedowns(
    p_status text default '',
    p_reason text default '',
    p_search text default ''
)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select jsonb_build_object(
        'count', count(*)::bigint,
        'results', coalesce(jsonb_agg(payload order by created_at desc), '[]'::jsonb),
        'available_statuses', '["pending", "under_review", "content_unpublished", "resolved_kept", "rejected"]'::jsonb
    )
    from (
        select
            tr.created_at as created_at,
            jsonb_build_object(
                'id', tr.id,
                'song', tr.song_id,
                'song_title', s.title,
                'artist_name', a.display_name,
                'claimant_name', tr.claimant_name,
                'claimant_email', tr.claimant_email,
                'reason', tr.reason,
                'details', tr.details,
                'status', tr.status,
                'resolution_notes', tr.resolution_notes,
                'created_at', tr.created_at,
                'resolved_at', tr.resolved_at
            ) as payload
        from public.takedown_requests tr
        join public.songs s on s.id = tr.song_id
        left join public.artists a on a.id = s.artist_id
        where (coalesce(p_status, '') = '' or tr.status = p_status)
          and (coalesce(p_reason, '') = '' or tr.reason = p_reason)
          and (
              coalesce(p_search, '') = '' or
              s.title ilike '%' || p_search || '%' or
              s.title_ne ilike '%' || p_search || '%' or
              a.display_name ilike '%' || p_search || '%' or
              tr.claimant_name ilike '%' || p_search || '%' or
              tr.claimant_email ilike '%' || p_search || '%'
          )
    ) t;
$$;

create or replace function public.admin_takedown_action(
    p_id bigint,
    p_status text,
    p_resolution_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    tr public.takedown_requests;
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    select * into tr from public.takedown_requests where id = p_id;
    if not found then
        raise exception 'Report not found';
    end if;
    if p_status not in ('pending', 'under_review', 'content_unpublished', 'resolved_kept', 'rejected') then
        raise exception 'Invalid status';
    end if;

    update public.takedown_requests set
        status = p_status,
        resolution_notes = coalesce(p_resolution_notes, ''),
        resolved_at = case
            when p_status in ('content_unpublished', 'resolved_kept', 'rejected') then now()
            else resolved_at
        end
    where id = p_id;

    if p_status = 'content_unpublished' then
        update public.songs set publication_status = 'taken_down' where id = tr.song_id;
    end if;

    perform public._audit('TAKEDOWN_' || upper(p_status), 'TakedownRequest', p_id::text, jsonb_build_object(
        'song_id', tr.song_id,
        'notes', coalesce(p_resolution_notes, '')
    ));

    return (
        select jsonb_build_object(
            'id', t.id, 'song', t.song_id, 'song_title', s.title, 'artist_name', a.display_name,
            'claimant_name', t.claimant_name, 'claimant_email', t.claimant_email,
            'reason', t.reason, 'details', t.details, 'status', t.status,
            'resolution_notes', t.resolution_notes, 'created_at', t.created_at, 'resolved_at', t.resolved_at
        )
        from public.takedown_requests t
        join public.songs s on s.id = t.song_id
        left join public.artists a on a.id = s.artist_id
        where t.id = p_id
    );
end;
$$;

create or replace function public.admin_audit_logs()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
    if not public.is_admin() then
        raise exception 'Admin access required';
    end if;

    return (
    select coalesce(jsonb_agg(
        jsonb_build_object(
            'id', l.id,
            'actor_username', l.actor_username,
            'action', l.action,
            'target_model', l.target_model,
            'target_id', l.target_id,
            'details', l.details,
            'timestamp', l.timestamp
        ) order by l.timestamp desc
    ), '[]'::jsonb)
    from (
        select * from public.audit_logs
        order by timestamp desc
        limit 100
    ) l
    );
end;
$$;

commit;
