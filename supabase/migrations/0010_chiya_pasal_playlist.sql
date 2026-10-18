-- Bajeko Chiya Pasal — 0010_chiya_pasal_playlist.sql
--
-- Curates the 22-song playlist shown in the "The Tea Shop" card on the home
-- page. Every provider_video_id below was checked against YouTube's player
-- metadata (playable_in_embed = true), so none of these tracks reproduce the
-- "publisher restricted embedded playback" error.
--
-- Idempotent. On a brand-new database the migrations run before seed.sql, so
-- the guard below turns this into a no-op and seed.sql installs the same
-- block. Keep this list and the copy at the end of seed.sql in sync.

begin;

do $$
declare
  v_station_id bigint;
begin
  if not exists (select 1 from public.songs limit 1) then
    raise notice 'chiya playlist: catalog is empty - seed.sql installs this playlist';
    return;
  end if;

  -- Live databases seeded through the generated festival bundle inserted
  -- artists/songs with explicit ids without advancing the identity
  -- sequences, so the next implicit id could collide. Resync both first.
  perform setval(
    pg_get_serial_sequence('public.artists', 'id'),
    coalesce((select max(id) from public.artists), 1)
  );
  perform setval(
    pg_get_serial_sequence('public.songs', 'id'),
    coalesce((select max(id) from public.songs), 1)
  );

  -- Performers behind the playlist that are not already in the catalog.
  insert into public.artists (display_name, display_name_ne, biography, verification_status, created_at, updated_at)
  select v.display_name, v.display_name_ne, v.biography, 'verified', now(), now()
  from (values
    ('Ghulam Ali Khan', 'गुलाम अली खान', 'Legendary ghazal and Nepali-adhunik singer.'),
    ('Uday Sotang', 'उदय सोताङ', 'Nepali singer-composer known for melodic adhunik songs.'),
    ('Ramesh Dhital', 'रमेश धिताल', 'Versatile Nepali playback singer of the golden era.'),
    ('Deepa Jha', 'दीपा झा', 'Nepali playback singer known for film duets.'),
    ('Bhupendra Singh', 'भुपेन्द्र सिंह', 'Nepali playback and ghazal singer.'),
    ('Madan Krishna Shrestha', 'मदन कृष्ण श्रेष्ठ', 'Comedian, actor and satirical singer of the Paleti series.'),
    ('Udit Narayan Jha', 'उदित नारायण झा', 'Playback singer born in Nepal, celebrated across South Asia.'),
    ('Bijay Gurung', 'विजय गुरुङ', 'Vocalist of the rock band Kalind.'),
    ('Dhiraj Rai', 'धीरज राई', 'Nepali pop-rock artist and stage performer.'),
    ('Sad Rose Band', 'स्याड रोज ब्यान्ड', 'Nepali pop-rock band of the 2000s.'),
    ('Jyoti Ghimire', 'ज्योति घिमिरे', 'Nepali pop singer of the 2000s.'),
    ('Sudip Giri', 'सुदीप गिरी', 'Nepali singer-songwriter of emotional pop songs.'),
    ('Yash Kumar', 'यश कुमार', 'Nepali pop singer and performer.'),
    ('Sapana Shree', 'सपना श्री', 'Nepali playback singer of romantic duets.')
  ) as v(display_name, display_name_ne, biography)
  where not exists (
    select 1 from public.artists a
    where lower(a.display_name) = lower(v.display_name)
  );

  -- Databases that applied an earlier draft of this playlist may hold the
  -- same songs with an empty provider_video_id (they can never play). Remove
  -- only those draft rows; the correct versions are re-created below.
  delete from public.songs
  where id between 1300 and 1321
    and provider_video_id = ''
    and title in (
      'Gajalu Ti Thula Thula', 'Yo Samjhine Mann Chha', 'Yati Chokho Yati Mitho',
      'Malai Nasodha', 'Deuralima Batas', 'Para Laijau Phoolharu',
      'Tadha Tadha Janu Chha Sathi', 'Iisarale Bolaunu', 'Timile Ta Hoina Timra',
      'Arabau Manchhe Haruma', 'Yesto Pani Hudo Raichha', 'Timilai Dekher Aankha',
      'Yo Naniko Shiraimaa', 'Pohor Saal Khusi', 'Lajalu Muskanle Priyase',
      'Luki Luki', 'Chari Udyo Badal Chhunalai', 'Nashalu Timro Heraile',
      'Pheri Tyo Din', 'Tutnu Thiyo Tutyo Mutu', 'Timro Man Badaliye Cha',
      'Maan Ko Nischalata Ma'
    );

  -- Recordings that already exist in the catalog. Re-point the wrong or
  -- embed-blocked video ids and classify them for the tea-shop panel instead
  -- of inserting duplicates.
  update public.songs set
    provider_video_id = 'CAv5Ii8V5AU',
    provider_url = 'https://www.youtube.com/watch?v=CAv5Ii8V5AU',
    source_url = 'https://www.youtube.com/watch?v=CAv5Ii8V5AU',
    artwork_url = 'https://img.youtube.com/vi/CAv5Ii8V5AU/hqdefault.jpg',
    duration_seconds = 303,
    attribution = 'Music Nepal',
    mood_tags = case when mood_tags @> '["tea-shop"]'::jsonb then mood_tags else mood_tags || '["tea-shop"]'::jsonb end,
    updated_at = now()
  where id = 97; -- Yo Samjhine Man Chha (previously pointed at Kehi Mitho Baat Gara)

  update public.songs set
    duration_seconds = 243,
    mood_tags = case when mood_tags @> '["tea-shop"]'::jsonb then mood_tags else mood_tags || '["tea-shop"]'::jsonb end,
    updated_at = now()
  where id = 1098; -- Malai Nasodha Kaha Dukcha Ghau

  update public.songs set
    duration_seconds = 287,
    mood_tags = case when mood_tags @> '["tea-shop"]'::jsonb then mood_tags else mood_tags || '["tea-shop"]'::jsonb end,
    updated_at = now()
  where id = 1110; -- Para Laijau Phool Haru

  update public.songs set
    duration_seconds = 247,
    mood_tags = case when mood_tags @> '["tea-shop"]'::jsonb then mood_tags else mood_tags || '["tea-shop"]'::jsonb end,
    updated_at = now()
  where id = 1112; -- Timle Ta Hoina (Timile Ta Hoina Timra)

  update public.songs set
    provider_video_id = 'IAcX4UWEBko',
    provider_url = 'https://www.youtube.com/watch?v=IAcX4UWEBko',
    source_url = 'https://www.youtube.com/watch?v=IAcX4UWEBko',
    artwork_url = 'https://img.youtube.com/vi/IAcX4UWEBko/hqdefault.jpg',
    duration_seconds = 215,
    attribution = 'Mr Lyrics',
    mood_tags = case when mood_tags @> '["tea-shop"]'::jsonb then mood_tags else mood_tags || '["tea-shop"]'::jsonb end,
    updated_at = now()
  where id = 1130; -- Pheri Tyo Din (official upload is age-restricted and cannot embed)

  update public.songs set
    duration_seconds = 239,
    release_year = 2007,
    decade = '2000s',
    film_or_source = 'Paleti (2007, Vol. 1)',
    mood_tags = case when mood_tags @> '["tea-shop"]'::jsonb then mood_tags else mood_tags || '["tea-shop"]'::jsonb end,
    updated_at = now()
  where id = 1156; -- Yesto Pani Hudo Raicha

  update public.songs set
    duration_seconds = 207,
    mood_tags = case when mood_tags @> '["tea-shop"]'::jsonb then mood_tags else mood_tags || '["tea-shop"]'::jsonb end,
    updated_at = now()
  where id = 4; -- Pohor Saal Khusi Phatyo

  -- The 16 recordings that are not in the catalog yet.
  insert into public.songs (
    title, title_ne, romanized_title, artist_id, featured_artists, composer,
    lyricist, album, film_or_source, release_year, language, primary_genre_id,
    mood_tags, decade, duration_seconds, artwork_url, playback_provider,
    provider_video_id, provider_url, source_url, attribution,
    metadata_verification_status, publication_status, play_count, is_featured,
    featured_order, created_at, updated_at
  )
  select
    v.title, v.title_ne, v.romanized_title, a.id, v.featured_artists, v.composer,
    v.lyricist, v.album, v.film_or_source, v.release_year, 'Nepali',
    (select g.id from public.genres g where g.slug = v.genre_slug limit 1),
    v.mood_tags::jsonb, v.decade, v.duration_seconds,
    'https://img.youtube.com/vi/' || v.video_id || '/hqdefault.jpg',
    'youtube', v.video_id,
    'https://www.youtube.com/watch?v=' || v.video_id,
    'https://www.youtube.com/watch?v=' || v.video_id,
    v.attribution, v.verification, 'published', 0, false, 0, now(), now()
  from (values
    ('Gajalu Ti Thula Thula', 'गजलु ती ठूला ठूला', 'Gajalu Ti Thula Thula', 'Ghulam Ali Khan', '', 'Ghulam Ali Khan', '', '', '', 1985, 'adhunik-geet', '["romantic", "nostalgic", "classic", "tea-shop"]', '1980s', 293, 'ftEzdVJWdDA', 'Music Nepal', 'verified'),
    ('Yati Chokho Yati Mitho', 'यति चोखो यति मिठो', 'Yati Chokho Yati Mitho', 'Uday Sotang', '', 'Gopal Yonjan', '', '', '', 1995, 'adhunik-geet', '["romantic", "melodic", "remake", "tea-shop"]', '1990s', 305, 'gj-PfQaMsLA', 'Uday Sotang', 'verified'),
    ('Deuralima Batas', 'देउरालीमा बतास', 'Deuralima Batas', 'Ramesh Dhital', 'Prem Dhoj Pradhan', 'Natikaji', '', '', '', 1985, 'adhunik-geet', '["romantic", "nostalgic", "classic", "tea-shop"]', '1980s', 261, 'CtfD9sMY7Sg', 'Prem Dhoj Pradhan', 'verified'),
    ('Tadha Tadha Janu Chha Sathi', 'टाढा टाढा जानु छ साथी', 'Tadha Tadha Janu Chha Sathi', 'Bachchu Kailash', '', 'Bachchu Kailash', '', '', '', 1990, 'adhunik-geet', '["romantic", "friendship", "classic", "tea-shop"]', '1990s', 215, 'EwjsonqeF_Y', 'FUNMANDU', 'verified'),
    ('Isarale Bolaunu Pardaina', 'ईसाराले बोलाउनु पर्दैन', 'Isarale Bolaunu Pardaina', 'Deepa Jha', 'Bhupendra Singh', '', '', '', 'Anyaya (Film)', 1995, 'film-songs', '["romantic", "duet", "classic", "tea-shop"]', '1990s', 259, 'ylDclgUmtwM', 'Music Nepal Entertainment', 'verified'),
    ('Timile Ta Hoina Timra', 'तिमीले त होइन तिम्रा', 'Timile Ta Hoina Timra', 'Bachchu Kailash', '', 'Bachchu Kailash', '', '', '', 1990, 'adhunik-geet', '["romantic", "emotional", "classic", "tea-shop"]', '1990s', 247, 'iuE3ckTNZiQ', 'Natikaji Shrestha', 'community_submitted'),
    ('Arabau Manchhe Haruma', 'अरबौं मान्छेहरूमा', 'Arabau Manchhe Haruma', 'Madan Krishna Shrestha', '', 'Madan Krishna Shrestha', '', '', 'Paleti (2008, Vol. 1)', 2008, 'adhunik-geet', '["humor", "social", "contemporary", "tea-shop"]', '2000s', 333, 'NTMNBvJ2Mcg', 'Paleti', 'verified'),
    ('Timilai Dekher Aankha', 'तिमीलाई देखेर आँखा', 'Timilai Dekher Aankha', 'Udit Narayan Jha', '', 'Nati Kaji', '', '', '', 1995, 'adhunik-geet', '["romantic", "melodic", "classic", "tea-shop"]', '1990s', 194, 'H1umwXuLRvw', 'Music Nepal', 'verified'),
    ('Yo Naniko Shiraimaa', 'यो नानीको शिरैमा', 'Yo Naniko Shiraimaa', 'Prem Dhoj Pradhan', '', 'Prem Dhoj Pradhan', '', '', 'Paleti (2008, Vol. 2)', 2008, 'adhunik-geet', '["romantic", "classic", "golden-era", "tea-shop"]', '2000s', 288, '4rFIczNcuBw', 'Paleti', 'verified'),
    ('Lajalu Muskanle Priyase', 'लजालु मुस्कानले प्रियसे', 'Lajalu Muskanle Priyase', 'Bijay Gurung', '', 'Bijay Gurung', '', '', 'KALIND: 2 Sanket', 2015, 'acoustic-indie', '["romantic", "acoustic", "contemporary", "tea-shop"]', '2010s', 327, 'w1nZ-x5hf80', 'Bijay Gurung', 'verified'),
    ('Luki Luki', 'लुकी लुकी', 'Luki Luki', 'Dhiraj Rai', '', 'Dhiraj Rai', '', '', '', 2004, 'nepali-pop', '["romantic", "pop", "contemporary", "tea-shop"]', '2000s', 257, 'pyw3hp7YulI', 'Dhiraj Rai', 'verified'),
    ('Chari Udyo Badal Chhunalai', 'चरी उड्यो बादल छुनालाई', 'Chari Udyo Badal Chhunalai', 'Sad Rose Band', '', 'Sad Rose Band', '', 'Sad Rose', '', 2005, 'nepali-rock', '["rock", "romantic", "contemporary", "tea-shop"]', '2000s', 268, 'yix5s79KoSY', 'Music Nepal', 'verified'),
    ('Nashalu Timro Heraile', 'नशालु तिम्रो हेराइले', 'Nashalu Timro Heraile', 'Jyoti Ghimire', '', 'Jyoti Ghimire', '', '', '', 2005, 'adhunik-geet', '["romantic", "emotional", "contemporary", "tea-shop"]', '2000s', 261, 'ceUR3WUEQPo', 'Jyoti Ghimire', 'verified'),
    ('Tutnu Thiyo Tutyo Mutu', 'टुट्नु थियो टुट्यो मुटु', 'Tutnu Thiyo Tutyo Mutu', 'Sudip Giri', '', 'Sudip Giri', '', 'Canvass', '', 2017, 'nepali-pop', '["emotional", "heartbreak", "contemporary", "tea-shop"]', '2010s', 253, 'D9KXoMnVrQg', 'Sudip Giri', 'verified'),
    ('Timro Man Badaliye Cha', 'तिम्रो मन बदलिएछ', 'Timro Man Badaliye Cha', 'Yash Kumar', 'Sapana Shree', 'Yash Kumar', '', 'Reason', '', 2016, 'nepali-pop', '["romantic", "pop", "duet", "tea-shop"]', '2010s', 284, 'EZvZ8ckEBZQ', 'Dhaulagiri Digital Nepal', 'verified'),
    ('Maan Ko Nischalata Ma', 'मनको निश्चलतामा', 'Maan Ko Nischalata Ma', 'Tara Devi', '', 'Natikaji', 'Chandani Shah', 'Chadani Shah Ka Geet 2', '', 1970, 'adhunik-geet', '["classic", "golden-era", "emotional", "tea-shop"]', '1970s', 242, 'cnnW2nLIPWU', 'Music Nepal', 'verified')
  ) as v(
    title, title_ne, romanized_title, artist_name, featured_artists, composer,
    lyricist, album, film_or_source, release_year, genre_slug, mood_tags,
    decade, duration_seconds, video_id, attribution, verification
  )
  join public.artists a on lower(a.display_name) = lower(v.artist_name)
  where not exists (
    select 1 from public.songs s where s.provider_video_id = v.video_id
  );

  perform setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));

  select id into v_station_id from public.stations where slug = 'chiya-pasal';
  if v_station_id is null then
    raise notice 'chiya playlist: chiya-pasal station missing, skipping queue wiring';
    return;
  end if;

  -- Keep the older station picks after the curated playlist so the tea-shop
  -- card opens with these tracks in order.
  -- Some legacy rows share a video id (for example Eklo Raat reused the Pohor
  -- Saal upload), so resolve each entry to the row whose title actually
  -- matches before wiring the queue.
  update public.station_songs ss
  set position = ss.position + 100
  where ss.station_id = v_station_id
    and ss.position < 100
    and ss.song_id not in (
      select s.id
      from (values
        ('ftEzdVJWdDA', 'Gajalu'), ('CAv5Ii8V5AU', 'Yo Samjhine'),
        ('gj-PfQaMsLA', 'Yati Chokho'), ('Pkj6YFJFI8U', 'Malai Nasodha'),
        ('CtfD9sMY7Sg', 'Deuralima'), ('1tnvDCzf5Dc', 'Para Laijau'),
        ('EwjsonqeF_Y', 'Tadha Tadha'), ('ylDclgUmtwM', 'Isarale'),
        ('iuE3ckTNZiQ', 'Timle Ta Hoina'), ('NTMNBvJ2Mcg', 'Arabau'),
        ('fUebAVu-Pcw', 'Yesto Pani'), ('H1umwXuLRvw', 'Timilai Dekher'),
        ('4rFIczNcuBw', 'Yo Naniko'), ('8uIaRZrB6Jk', 'Pohor Saal'),
        ('w1nZ-x5hf80', 'Lajalu'), ('pyw3hp7YulI', 'Luki Luki'),
        ('yix5s79KoSY', 'Chari Udyo'), ('ceUR3WUEQPo', 'Nashalu'),
        ('IAcX4UWEBko', 'Pheri Tyo Din'), ('D9KXoMnVrQg', 'Tutnu Thiyo'),
        ('EZvZ8ckEBZQ', 'Timro Man Badaliye'), ('cnnW2nLIPWU', 'Maan Ko Nischalata')
      ) as v(video_id, title_hint)
      join lateral (
        select s2.id
        from public.songs s2
        where s2.provider_video_id = v.video_id
        order by (s2.title ilike '%' || v.title_hint || '%') desc, s2.id
        limit 1
      ) s on true
    );

  insert into public.station_songs (station_id, song_id, position)
  select v_station_id, s.id, v.position
  from (values
    ('ftEzdVJWdDA', 'Gajalu', 0), ('CAv5Ii8V5AU', 'Yo Samjhine', 1),
    ('gj-PfQaMsLA', 'Yati Chokho', 2), ('Pkj6YFJFI8U', 'Malai Nasodha', 3),
    ('CtfD9sMY7Sg', 'Deuralima', 4), ('1tnvDCzf5Dc', 'Para Laijau', 5),
    ('EwjsonqeF_Y', 'Tadha Tadha', 6), ('ylDclgUmtwM', 'Isarale', 7),
    ('iuE3ckTNZiQ', 'Timle Ta Hoina', 8), ('NTMNBvJ2Mcg', 'Arabau', 9),
    ('fUebAVu-Pcw', 'Yesto Pani', 10), ('H1umwXuLRvw', 'Timilai Dekher', 11),
    ('4rFIczNcuBw', 'Yo Naniko', 12), ('8uIaRZrB6Jk', 'Pohor Saal', 13),
    ('w1nZ-x5hf80', 'Lajalu', 14), ('pyw3hp7YulI', 'Luki Luki', 15),
    ('yix5s79KoSY', 'Chari Udyo', 16), ('ceUR3WUEQPo', 'Nashalu', 17),
    ('IAcX4UWEBko', 'Pheri Tyo Din', 18), ('D9KXoMnVrQg', 'Tutnu Thiyo', 19),
    ('EZvZ8ckEBZQ', 'Timro Man Badaliye', 20), ('cnnW2nLIPWU', 'Maan Ko Nischalata', 21)
  ) as v(video_id, title_hint, position)
  join lateral (
    select s2.id
    from public.songs s2
    where s2.provider_video_id = v.video_id
    order by (s2.title ilike '%' || v.title_hint || '%') desc, s2.id
    limit 1
  ) s on true
  on conflict (station_id, song_id) do update set position = excluded.position;
end $$;

commit;
