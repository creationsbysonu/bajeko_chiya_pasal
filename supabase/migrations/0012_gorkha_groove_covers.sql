-- Bajeko Chiya Pasal — 0012_gorkha_groove_covers.sql
--
-- Adds the 29 tracks of the "Nepali Rock Songs" playlist by Gorkha Groove
-- (https://music.youtube.com/watch?v=IxWqbYDaJjM&list=PLwNcm3sBxqXFTevrzdEwKZHrk_38Yzh2k)
-- — modern acoustic / blues / folk covers (some AI-generated) of classic
-- Nepali songs — and places each one on the station it fits:
--
--   biraha               8  (heartbreak and rain-soaked blues)
--   nepali-rock          5  (blues-rock and rock reworks)
--   prem-geet            5  (romantic covers)
--   lok-dohori           5  (folk and sarangi-flavoured covers)
--   purano-radio         5  (revivals of golden-era classics)
--   himalayan-acoustic   1  (the tungna mountain cover)
--
-- Every provider_video_id below was resolved from the playlist itself and
-- checked against YouTube's metadata (playableInEmbed = true). release_year is
-- the upload's publication year; the recordings are Gorkha Groove covers, so
-- the artist credit is Gorkha Groove, not the original singers.
--
-- Idempotent. On a brand-new database the migrations run before seed.sql, so
-- the empty-catalog guard below turns this into a no-op and the copy at the
-- end of seed.sql installs the same tracks. Keep the two blocks in sync.

begin;

do $$
declare
  v_artist_id bigint;
begin
  if not exists (select 1 from public.songs limit 1) then
    raise notice 'gorkha covers: catalog is empty - seed.sql installs these tracks';
    return;
  end if;

  perform setval(
    pg_get_serial_sequence('public.artists', 'id'),
    coalesce((select max(id) from public.artists), 1)
  );
  perform setval(
    pg_get_serial_sequence('public.songs', 'id'),
    coalesce((select max(id) from public.songs), 1)
  );

  select id into v_artist_id
  from public.artists
  where lower(display_name) = 'gorkha groove'
  order by id
  limit 1;

  if v_artist_id is null then
    insert into public.artists (display_name, display_name_ne, biography, verification_status, created_at, updated_at)
    values (
      'Gorkha Groove', 'गोर्खा ग्रुभ',
      'Kathmandu-based band known for acoustic, blues and folk covers of classic Nepali songs.',
      'verified', now(), now()
    )
    returning id into v_artist_id;
  end if;

  insert into public.songs (
    title, title_ne, romanized_title, artist_id, featured_artists, composer,
    lyricist, album, film_or_source, release_year, language, primary_genre_id,
    mood_tags, decade, duration_seconds, artwork_url, playback_provider,
    provider_video_id, provider_url, source_url, attribution,
    metadata_verification_status, publication_status, play_count, is_featured,
    featured_order, created_at, updated_at
  )
  select
    v.title, v.title_ne, v.romanized_title, v_artist_id, '', '', '',
    'Gorkha Groove Covers', '', 2026, 'Nepali',
    (select g.id from public.genres g where g.slug = v.genre_slug limit 1),
    v.mood_tags::jsonb, '2020s', v.duration_seconds,
    'https://img.youtube.com/vi/' || v.video_id || '/hqdefault.jpg',
    'youtube', v.video_id,
    'https://www.youtube.com/watch?v=' || v.video_id,
    'https://www.youtube.com/watch?v=' || v.video_id,
    'Gorkha Groove', 'verified', 'published', 0, false, 0, now(), now()
  from (values
    ('biraha', 'lBuu8RaIknQ', 0, 'Bhagyamani Timi Hau E Sanu (Cover)', 'भाग्यमानी तिमी हौ ए सानु (कभर)', 'Bhagyamani Timi Hau E Sanu Cover', 'acoustic-indie', '["cover", "gorkha-groove", "blues", "heartbreak"]', 300),
    ('biraha', 'oekXvWhse1o', 1, 'Rani Ghataima (Cover)', 'रानी घाटैमा (कभर)', 'Rani Ghataima Cover', 'acoustic-indie', '["cover", "gorkha-groove", "blues", "heartbreak"]', 305),
    ('prem-geet', 'IxWqbYDaJjM', 2, 'Dharanako Bajarama (Lofi Cover)', 'धरानको बजारमा (लोफि कभर)', 'Dharanako Bajarama Lofi Cover', 'acoustic-indie', '["cover", "gorkha-groove", "lofi", "romantic"]', 254),
    ('lok-dohori', 'FUE7ydySquY', 3, 'Seti Khola Sang Sangai Tarchhu Hai (Guitar Cover)', 'सेती खोला सँग सँगै तर्छु है (गिटार कभर)', 'Seti Khola Sang Sangai Tarchhu Hai Guitar Cover', 'lok-dohori', '["cover", "gorkha-groove", "folk", "romantic"]', 176),
    ('lok-dohori', '6KnWHi6YL4Q', 4, 'Seti Khola Sang Sangai Tarchhu Hai (Acoustic Cover)', 'सेती खोला सँग सँगै तर्छु है (एकौस्टिक कभर)', 'Seti Khola Sang Sangai Tarchhu Hai Acoustic Cover', 'lok-dohori', '["cover", "gorkha-groove", "folk", "acoustic"]', 188),
    ('biraha', '7ihpVW7dd8E', 5, 'Bhijyo Sirani Raatma (Soulful Cover)', 'भीज्यो सिरानी रातमा (सोलफुल कभर)', 'Bhijyo Sirani Raatma Soulful Cover', 'adhunik-geet', '["cover", "gorkha-groove", "blues", "sad"]', 224),
    ('nepali-rock', 'JTBi5D-CUWY', 6, 'Halla Chalechha (Blues Cover)', 'हल्ला चलेछ (ब्लुज कभर)', 'Halla Chalechha Blues Cover', 'nepali-rock', '["cover", "gorkha-groove", "blues", "rock"]', 301),
    ('nepali-rock', 's7anD2kysvk', 7, 'Lahana Le Jurayo Ki (AI Cover)', 'लहाना ले जुरायो कि (एआई कभर)', 'Lahana Le Jurayo Ki AI Cover', 'nepali-rock', '["cover", "gorkha-groove", "rock", "ai-cover"]', 222),
    ('purano-radio', 'fpg7jHsUKoI', 8, 'Kusume Rumal (Blues Cover)', 'कुसुमे रुमाल (ब्लुज कभर)', 'Kusume Rumal Blues Cover', 'adhunik-geet', '["cover", "gorkha-groove", "blues", "nostalgic"]', 248),
    ('biraha', 'CTXpba34uds', 9, 'Samjhana Cha Chodi Jane Lai (Blues Cover)', 'सम्झन छ छोडी जाने लाई (ब्लुज कभर)', 'Samjhana Cha Chodi Jane Lai Blues Cover', 'adhunik-geet', '["cover", "gorkha-groove", "blues", "heartbreak"]', 231),
    ('purano-radio', 'ImJPbKSFdW0', 10, 'Phoolpati Bhakera Manakamana (Cover)', 'फूलपाती भाकेर मनाकामना (कभर)', 'Phoolpati Bhakera Manakamana Cover', 'adhunik-geet', '["cover", "gorkha-groove", "evergreen", "nostalgic"]', 290),
    ('prem-geet', 'Nk0V7jGxqXk', 11, 'Dharan Ko Bajarma (Maya Dharani) (Folk Pop Cover)', 'धरानको बजारमा (माया धरानी) (कभर)', 'Dharan Ko Bajarma Maya Dharani Cover', 'adhunik-geet', '["cover", "gorkha-groove", "romantic", "folk"]', 248),
    ('biraha', 'eKBAl_pvczA', 12, 'Bhijyo Sirani Raatma (Sarangi Cover)', 'भीज्यो सिरानी रातमा (सारङ्गी कभर)', 'Bhijyo Sirani Raatma Sarangi Cover', 'adhunik-geet', '["cover", "gorkha-groove", "sarangi", "sad"]', 286),
    ('lok-dohori', 'svhOhTMmDWI', 13, 'Lali Joban Janchha Ki Hajur (Folk Fusion Cover)', 'लाली जोबन जान्छ कि हजुर (कभर)', 'Lali Joban Janchha Ki Hajur Cover', 'lok-dohori', '["cover", "gorkha-groove", "folk", "fusion"]', 455),
    ('biraha', 'S8roUVDvPCA', 14, 'Yo Jindagile K Garyo K Garyo (Blues Cover)', 'यो जिन्दगिले के गर्यो के गर्यो (ब्लुज कभर)', 'Yo Jindagile K Garyo K Garyo Blues Cover', 'adhunik-geet', '["cover", "gorkha-groove", "blues", "emotional"]', 310),
    ('biraha', 'BQtFPJ-vpqs', 15, 'Biratako Chino (Emotional Cover)', 'वीरताको चिनो (कभर)', 'Biratako Chino Cover', 'adhunik-geet', '["cover", "gorkha-groove", "emotional", "ai-cover"]', 318),
    ('lok-dohori', 'Q_TgclGrhS4', 16, 'Sora Barse Umerai Ma (Acoustic Blues Cover)', 'सोरा बर्षे उमेरैमा (कभर)', 'Sora Barse Umerai Ma Cover', 'lok-dohori', '["cover", "gorkha-groove", "folk", "acoustic"]', 219),
    ('biraha', 'vbFJ5mAa8f0', 17, 'Ghumti Nira Late Bhayo (Blues Cover)', 'घुम्ती निरा लाते भयो (ब्लुज कभर)', 'Ghumti Nira Late Bhayo Blues Cover', 'adhunik-geet', '["cover", "gorkha-groove", "blues", "sad"]', 255),
    ('nepali-rock', '3qW_x7ANhOI', 18, 'Jun Ta Lagyo Tara Le (Blues Rock Cover)', 'जुन तालाग्यो तराले (ब्लुज रक कभर)', 'Jun Ta Lagyo Tara Le Blues Rock Cover', 'nepali-rock', '["cover", "gorkha-groove", "blues", "rock"]', 215),
    ('nepali-rock', 'tzs0O4Qn3ew', 19, 'Lahana Le Jurayo Ki (Blues Rock Cover)', 'लहाना ले जुरायो कि (ब्लुज रक कभर)', 'Lahana Le Jurayo Ki Blues Rock Cover', 'nepali-rock', '["cover", "gorkha-groove", "blues", "rock"]', 263),
    ('purano-radio', 'J96sPD0IkRg', 20, 'Banma Fulyo Phool (Blues Cover)', 'बनमा फुल्यो फूल (ब्लुज कभर)', 'Banma Fulyo Phool Blues Cover', 'adhunik-geet', '["cover", "gorkha-groove", "blues", "evergreen"]', 302),
    ('purano-radio', 'TpQd5h_EoCA', 21, 'Bagaichama Najau Timi (Cover)', 'बगैँचामा नजाऊ तिमी (कभर)', 'Bagaichama Najau Timi Cover', 'film-songs', '["cover", "gorkha-groove", "film", "nostalgic"]', 200),
    ('himalayan-acoustic', 'MaeBUEYg_XU', 22, 'Tungna Ko Dhun Ma (Lonely Soul Cover)', 'टुङनाको धुनमा (कभर)', 'Tungna Ko Dhun Ma Cover', 'lok-dohori', '["cover", "gorkha-groove", "folk", "mountain"]', 328),
    ('purano-radio', 'c_-fxzm07PU', 23, 'Hamro Chitwan (Revival Cover)', 'हाम्रो चितवन (कभर)', 'Hamro Chitwan Cover', 'adhunik-geet', '["cover", "gorkha-groove", "nostalgic", "revival"]', 334),
    ('prem-geet', 'vsSWsxzcbfI', 24, 'Sanu Ma (Acoustic Cover)', 'सानु म (एकौस्टिक कभर)', 'Sanu Ma Acoustic Cover', 'acoustic-indie', '["cover", "gorkha-groove", "acoustic", "romantic"]', 227),
    ('prem-geet', 'AReSPr9GrTk', 25, 'Tara Antim Palt Bhetna Aau (Slowed + Reverb)', 'तर अन्तिम पल्ट भेट्न आउ (कभर)', 'Tara Antim Palt Bhetna Aau Cover', 'adhunik-geet', '["cover", "gorkha-groove", "romantic", "slowed-reverb"]', 265),
    ('lok-dohori', 'J4ubxi_Tp4c', 26, 'Muglin Pari Tarera Gandaki (Acoustic Cover)', 'मुग्लिन पारि तरेरा गण्डकी (एकौस्टिक कभर)', 'Muglin Pari Tarera Gandaki Cover', 'lok-dohori', '["cover", "gorkha-groove", "folk", "acoustic"]', 286),
    ('prem-geet', 'CYbj17AHO3Q', 27, 'Purano Hudaina Maya (Acoustic Blues Cover)', 'पुरानो हुदैन माया (कभर)', 'Purano Hudaina Maya Cover', 'acoustic-indie', '["cover", "gorkha-groove", "acoustic", "romantic"]', 299),
    ('nepali-rock', 'IG783p38HuY', 28, 'Kisan Ko Rahar (Rock Blues Cover)', 'किसानको रहर (रक ब्लुज कभर)', 'Kisan Ko Rahar Cover', 'nepali-rock', '["cover", "gorkha-groove", "rock", "poem"]', 350)
  ) as v(
    station_slug, video_id, sort_order, title, title_ne, romanized_title,
    genre_slug, mood_tags, duration_seconds
  )
  where not exists (
    select 1 from public.songs s where s.provider_video_id = v.video_id
  );

  perform setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));

  -- Drop any links from an earlier run of this migration, then append each
  -- cover after the station's existing picks so the order stays stable.
  delete from public.station_songs ss
  using public.stations st, (values
    ('biraha', 'lBuu8RaIknQ'), ('biraha', 'oekXvWhse1o'),
    ('biraha', '7ihpVW7dd8E'), ('biraha', 'CTXpba34uds'),
    ('biraha', 'eKBAl_pvczA'), ('biraha', 'S8roUVDvPCA'),
    ('biraha', 'BQtFPJ-vpqs'), ('biraha', 'vbFJ5mAa8f0'),
    ('nepali-rock', 'JTBi5D-CUWY'), ('nepali-rock', 's7anD2kysvk'),
    ('nepali-rock', '3qW_x7ANhOI'), ('nepali-rock', 'tzs0O4Qn3ew'),
    ('nepali-rock', 'IG783p38HuY'),
    ('prem-geet', 'IxWqbYDaJjM'), ('prem-geet', 'Nk0V7jGxqXk'),
    ('prem-geet', 'vsSWsxzcbfI'), ('prem-geet', 'AReSPr9GrTk'),
    ('prem-geet', 'CYbj17AHO3Q'),
    ('lok-dohori', 'FUE7ydySquY'), ('lok-dohori', '6KnWHi6YL4Q'),
    ('lok-dohori', 'svhOhTMmDWI'), ('lok-dohori', 'Q_TgclGrhS4'),
    ('lok-dohori', 'J4ubxi_Tp4c'),
    ('purano-radio', 'fpg7jHsUKoI'), ('purano-radio', 'ImJPbKSFdW0'),
    ('purano-radio', 'J96sPD0IkRg'), ('purano-radio', 'TpQd5h_EoCA'),
    ('purano-radio', 'c_-fxzm07PU'),
    ('himalayan-acoustic', 'MaeBUEYg_XU')
  ) as v(station_slug, video_id)
  where ss.station_id = st.id
    and st.slug = v.station_slug
    and exists (
      select 1 from public.songs s
      where s.id = ss.song_id and s.provider_video_id = v.video_id
    );

  with station_map as (
    select st.id as station_id, st.slug as station_slug
    from public.stations st
    where st.slug in (
      'biraha', 'nepali-rock', 'prem-geet', 'lok-dohori',
      'purano-radio', 'himalayan-acoustic'
    )
  ),
  resolved as (
    select v.station_slug, v.sort_order, s2.id as song_id
    from (values
      ('biraha', 'lBuu8RaIknQ', 0), ('biraha', 'oekXvWhse1o', 1),
      ('biraha', '7ihpVW7dd8E', 5), ('biraha', 'CTXpba34uds', 9),
      ('biraha', 'eKBAl_pvczA', 12), ('biraha', 'S8roUVDvPCA', 14),
      ('biraha', 'BQtFPJ-vpqs', 15), ('biraha', 'vbFJ5mAa8f0', 17),
      ('nepali-rock', 'JTBi5D-CUWY', 6), ('nepali-rock', 's7anD2kysvk', 7),
      ('nepali-rock', '3qW_x7ANhOI', 18), ('nepali-rock', 'tzs0O4Qn3ew', 19),
      ('nepali-rock', 'IG783p38HuY', 28),
      ('prem-geet', 'IxWqbYDaJjM', 2), ('prem-geet', 'Nk0V7jGxqXk', 11),
      ('prem-geet', 'vsSWsxzcbfI', 24), ('prem-geet', 'AReSPr9GrTk', 25),
      ('prem-geet', 'CYbj17AHO3Q', 27),
      ('lok-dohori', 'FUE7ydySquY', 3), ('lok-dohori', '6KnWHi6YL4Q', 4),
      ('lok-dohori', 'svhOhTMmDWI', 13), ('lok-dohori', 'Q_TgclGrhS4', 16),
      ('lok-dohori', 'J4ubxi_Tp4c', 26),
      ('purano-radio', 'fpg7jHsUKoI', 8), ('purano-radio', 'ImJPbKSFdW0', 10),
      ('purano-radio', 'J96sPD0IkRg', 20), ('purano-radio', 'TpQd5h_EoCA', 21),
      ('purano-radio', 'c_-fxzm07PU', 23),
      ('himalayan-acoustic', 'MaeBUEYg_XU', 22)
    ) as v(station_slug, video_id, sort_order)
    join lateral (
      select s3.id
      from public.songs s3
      where s3.provider_video_id = v.video_id
      order by s3.id
      limit 1
    ) s2 on true
  ),
  base as (
    select m.station_id, coalesce(max(ss.position) + 1, 0) as start_pos
    from station_map m
    left join public.station_songs ss on ss.station_id = m.station_id
    group by m.station_id
  )
  insert into public.station_songs (station_id, song_id, position)
  select m.station_id, r.song_id,
         b.start_pos + row_number() over (partition by m.station_id order by r.sort_order) - 1
  from resolved r
  join station_map m on m.station_slug = r.station_slug
  join base b on b.station_id = m.station_id
  on conflict (station_id, song_id) do update set position = excluded.position;
end $$;

commit;
