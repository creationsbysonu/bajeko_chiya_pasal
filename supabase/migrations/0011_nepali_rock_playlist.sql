-- Bajeko Chiya Pasal — 0011_nepali_rock_playlist.sql
--
-- Replaces the Nepali Rock station queue with a 19-track classic rock set
-- (Robin N' Looza, Cobweb, 1974 AD, The Uglyz, The Axe, Albatross, Nepathya,
-- Karma Band, Mantra Band, Shadows, Mukti & Revival). The old station picks
-- stay in the catalog because other stations (Purano Radio, Chiya Pasal,
-- Bus Yatra, ...) still reference them; only the station_songs links change.
--
-- Every provider_video_id below was resolved to the exact upload requested
-- (title + channel + duration) and checked against YouTube's player metadata
-- (playableInEmbed = true). release_year is the upload's publication year.
--
-- Idempotent. On a brand-new database the migrations run before seed.sql, so
-- the empty-catalog guard below turns this into a no-op and the copy at the
-- end of seed.sql installs the same playlist. Keep the two blocks in sync.

begin;

do $$
declare
  v_station_id bigint;
  v_genre_id bigint;
begin
  if not exists (select 1 from public.songs limit 1) then
    raise notice 'nepali rock: catalog is empty - seed.sql installs this playlist';
    return;
  end if;

  -- Seeded catalogs use explicit ids, so keep the identity sequences ahead.
  perform setval(
    pg_get_serial_sequence('public.artists', 'id'),
    coalesce((select max(id) from public.artists), 1)
  );
  perform setval(
    pg_get_serial_sequence('public.songs', 'id'),
    coalesce((select max(id) from public.songs), 1)
  );

  select id into v_genre_id from public.genres where slug = 'nepali-rock' limit 1;

  -- Performers behind the playlist that are not already in the catalog.
  insert into public.artists (display_name, display_name_ne, biography, verification_status, created_at, updated_at)
  select v.display_name, v.display_name_ne, v.biography, 'verified', now(), now()
  from (values
    ('Robin N'' Looza', 'रोबिन एन लुजा', 'Kathmandu rock vocalist and frontman of Robin & The New Revolution.'),
    ('Cobweb', 'कोबवेब', 'Kathmandu alternative rock band formed in the 1990s.'),
    ('Rojan N. Pradhan', 'रोजन एन. प्रधान', 'Nepali rock singer and songwriter.'),
    ('Karma Band', 'कर्मा ब्यान्ड', 'Nepali rock band of the independent 2000s scene.'),
    ('Mantra Band', 'मन्त्र ब्यान्ड', 'Nepali rock band known for the anthem Sanskriti.'),
    ('Shadows', 'स्याडोज', 'Nepali rock band behind the online favourite Prakriti.'),
    ('Mukti & Revival', 'मुक्ति एन्ड रिभाइभल', 'Nepali rock outfit behind Nahera Malai.')
  ) as v(display_name, display_name_ne, biography)
  where not exists (
    select 1 from public.artists a
    where lower(a.display_name) = lower(v.display_name)
  );

  insert into public.songs (
    title, title_ne, romanized_title, artist_id, featured_artists, composer,
    lyricist, album, film_or_source, release_year, language, primary_genre_id,
    mood_tags, decade, duration_seconds, artwork_url, playback_provider,
    provider_video_id, provider_url, source_url, attribution,
    metadata_verification_status, publication_status, play_count, is_featured,
    featured_order, created_at, updated_at
  )
  select
    v.title, v.title_ne, v.romanized_title, a.id, '', '', '',
    v.album, '', v.release_year, 'Nepali', v_genre_id,
    v.mood_tags::jsonb, v.decade, v.duration_seconds,
    'https://img.youtube.com/vi/' || v.video_id || '/hqdefault.jpg',
    'youtube', v.video_id,
    'https://www.youtube.com/watch?v=' || v.video_id,
    'https://www.youtube.com/watch?v=' || v.video_id,
    v.attribution, 'verified', 'published', 0, false, 0, now(), now()
  from (values
    ('Bhool Ma Bhulyo', 'भूलमा भुल्यो', 'Bhool Ma Bhulyo', 'Robin N'' Looza', '', 2011, '2010s', 204, 'cHDPcQK2Ygg', 'Jackey Niraula', '["rock", "heartbreak", "nostalgic"]'),
    ('Mercedes Benz', 'मर्सिडिज बेन्ज', 'Mercedes Benz', 'Cobweb', '', 2019, '2010s', 322, 'WwNk-zjdAqc', 'Cobweb Official', '["rock", "alternative", "satire"]'),
    ('Nepali Ho', 'नेपाली हो', 'Nepali Ho', '1974 AD', '', 2015, '2010s', 333, 'YpxsqLS-Xu4', '1974 AD', '["rock", "anthem", "patriotic"]'),
    ('Aaudai Jadai (Karaoke)', 'आउँदै जाँदै (कराओके)', 'Aaudai Jadai Karaoke', 'The Uglyz', '', 2022, '2020s', 250, '8tosNlV5wVU', 'The Uglyz', '["rock", "karaoke", "romantic"]'),
    ('Saas Hau Timi', 'सास हौ तिमी', 'Saas Hau Timi', 'Rojan N. Pradhan', '', 2014, '2010s', 288, 'nN99o3BFSXg', 'Rojan Pradhan', '["rock", "romantic", "melodic"]'),
    ('Hidchu Sadhai', 'हिँड्छु सधैं', 'Hidchu Sadhai', 'Cobweb', '', 2012, '2010s', 299, 'FW1Fkalkc-M', 'optimist cool', '["rock", "journey", "reflective"]'),
    ('Sanjha Ko Bela', 'साँझको बेला', 'Sanjha Ko Bela', '1974 AD', '', 2015, '2010s', 230, 'vuGgf_7LDyU', '1974 AD', '["rock", "evening", "romantic"]'),
    ('Lukna Deu', 'लुक्न देउ', 'Lukna Deu', 'The Axe Band', 'A Decade', 2014, '2010s', 281, 'YaQifvlDt8s', 'Budha Subba Digital', '["rock", "emotional", "melodic"]'),
    ('Timro Maya', 'तिम्रो माया', 'Timro Maya', 'Cobweb', '', 2019, '2010s', 367, '6vjP-SxGO30', 'Cobweb Official', '["rock", "romantic", "anthemic"]'),
    ('Parelima', 'परेलीमा', 'Parelima', '1974 AD', '', 2019, '2010s', 235, 'dE_Sc4Rj6HA', '1974 AD', '["rock", "nostalgic", "melodic"]'),
    ('Maya', 'माया', 'Maya', 'The Uglyz', '', 2017, '2010s', 227, 'GxXCJYIarTE', 'The Uglyz', '["rock", "romantic", "evergreen"]'),
    ('Kaha Hola Ghar Bara', 'कहाँ होला घर बारा', 'Kaha Hola Ghar Bara', 'Karma Band', '', 2008, '2000s', 226, '-qGN3auLEi0', 'easy0123', '["rock", "longing", "folk-rock"]'),
    ('Sanskriti', 'संस्कृति', 'Sanskriti', 'Mantra Band', '', 2017, '2010s', 326, 'HTq6PY7ev2c', 'Half Past Music', '["rock", "anthem", "cultural"]'),
    ('Prakriti', 'प्रकृति', 'Prakriti', 'Shadows', '', 2013, '2010s', 299, '4ponFx3EJ2s', 'Nishan Bhattarai', '["rock", "nature", "indie"]'),
    ('Sambodhan', 'सम्बोधन', 'Sambodhan', '1974 AD', '', 2015, '2010s', 291, 'wqlwwQiyZTU', '1974 AD', '["rock", "emotional", "poetic"]'),
    ('Timi Bhane (Studio)', 'तिमी भने (स्टुडियो)', 'Timi Bhane Studio', 'Albatross', '', 2015, '2010s', 324, 'jwDHDuxKU28', 'Nepali Music', '["rock", "romantic", "melodic"]'),
    ('Nahera Malai', 'नहेर मलाई', 'Nahera Malai', 'Mukti & Revival', '', 2017, '2010s', 223, 'ZM24fBfCnms', 'Ek Music', '["rock", "heartbreak", "alternative"]'),
    ('Sa Karnali', 'स कर्णाली', 'Sa Karnali', 'Nepathya', '', 2015, '2010s', 226, 'mbeeEo09A5A', 'Nepathya', '["rock", "folk-rock", "river"]'),
    ('Maryo Ni Maryo', 'मर्यो नि मर्यो', 'Maryo Ni Maryo', 'Cobweb', '', 2011, '2010s', 298, '_6ayqmBvjJI', 'imghale2', '["rock", "dark", "alternative"]')
  ) as v(
    title, title_ne, romanized_title, artist_name, album, release_year, decade,
    duration_seconds, video_id, attribution, mood_tags
  )
  join lateral (
    select a2.id
    from public.artists a2
    where lower(a2.display_name) = lower(v.artist_name)
    order by a2.id
    limit 1
  ) a on true
  where not exists (
    select 1 from public.songs s where s.provider_video_id = v.video_id
  );

  perform setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));

  select id into v_station_id from public.stations where slug = 'nepali-rock';
  if v_station_id is null then
    raise notice 'nepali rock: nepali-rock station missing, skipping queue wiring';
    return;
  end if;

  -- The station queue becomes exactly this set, in this order.
  delete from public.station_songs where station_id = v_station_id;

  insert into public.station_songs (station_id, song_id, position)
  select v_station_id, s.id, v.position
  from (values
    ('cHDPcQK2Ygg', 0), ('WwNk-zjdAqc', 1), ('YpxsqLS-Xu4', 2),
    ('8tosNlV5wVU', 3), ('nN99o3BFSXg', 4), ('FW1Fkalkc-M', 5),
    ('vuGgf_7LDyU', 6), ('YaQifvlDt8s', 7), ('6vjP-SxGO30', 8),
    ('dE_Sc4Rj6HA', 9), ('GxXCJYIarTE', 10), ('-qGN3auLEi0', 11),
    ('HTq6PY7ev2c', 12), ('4ponFx3EJ2s', 13), ('wqlwwQiyZTU', 14),
    ('jwDHDuxKU28', 15), ('ZM24fBfCnms', 16), ('mbeeEo09A5A', 17),
    ('_6ayqmBvjJI', 18)
  ) as v(video_id, position)
  join lateral (
    select s2.id
    from public.songs s2
    where s2.provider_video_id = v.video_id
    order by s2.id
    limit 1
  ) s on true
  on conflict (station_id, song_id) do update set position = excluded.position;
end $$;

commit;
