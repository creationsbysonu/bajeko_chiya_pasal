-- Bajeko Chiya Pasal — 0010_add_chiya_pasal_songs.sql
-- Add curated classic Nepali songs for the Bajeko Chiya Pasal playlist
-- These are timeless melodies perfect for a tea shop atmosphere

begin;

-- Add new artists if they don't exist
INSERT INTO public.artists (id, display_name, display_name_ne, biography, verification_status, created_at, updated_at) 
VALUES 
  (60, 'Ghulam Ali Khan', 'गुलाम अली खान', 'Legendary Nepali ghazal and classical singer.', 'verified', NOW(), NOW()),
  (61, 'Uday Sotang', 'उदय सोताङ', 'Nepali musician known for melodic compositions.', 'verified', NOW(), NOW()),
  (62, 'Ramesh Dhital', 'रमेश धिताल', 'Versatile Nepali playback singer.', 'verified', NOW(), NOW()),
  (63, 'Deepa', 'दीपा', 'Nepali playback singer from classic era.', 'verified', NOW(), NOW()),
  (64, 'Bhupendra', 'भुपेन्द्र', 'Renowned Nepali ghazal singer.', 'verified', NOW(), NOW()),
  (65, 'FUNMANDU', 'फनमण्डु', 'Nepali music producer and curator.', 'verified', NOW(), NOW()),
  (66, 'Phatteman', 'फट्टेमान', 'Nepali folk-pop singer.', 'verified', NOW(), NOW()),
  (67, 'Udit Narayan Jha', 'उदित नारायण झा', 'International playback singer born in Nepal.', 'verified', NOW(), NOW()),
  (68, 'Bijay Gurung', 'विजय गुरुङ', 'Nepali contemporary singer.', 'verified', NOW(), NOW()),
  (69, 'Dhiraj Rai', 'धीरज राई', 'Nepali pop-rock artist.', 'verified', NOW(), NOW()),
  (70, 'Sad Rose Band', 'स्याड रोज ब्यान्ड', 'Nepali rock band.', 'verified', NOW(), NOW()),
  (71, 'Jyoti Ghimire', 'ज्योति घिमिरे', 'Nepali playback singer.', 'verified', NOW(), NOW()),
  (72, 'Sugam Pokharel', 'सुगम पोखरेल', 'Modern Nepali pop-rock singer.', 'verified', NOW(), NOW()),
  (73, 'Sudip Giri', 'सुदीप गिरी', 'Nepali singer-songwriter.', 'verified', NOW(), NOW()),
  (74, 'Yash Kumar', 'यश कुमार', 'Nepali pop singer.', 'verified', NOW(), NOW()),
  (75, 'Sapana Shree', 'सपना श्री', 'Nepali playback singer.', 'verified', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update the artists sequence
SELECT setval(pg_get_serial_sequence('public.artists', 'id'), (SELECT GREATEST(MAX(id), 75) FROM public.artists));

-- Add classic songs perfect for tea shop atmosphere
INSERT INTO public.songs (
  id, title, title_ne, romanized_title, artist_id, featured_artists, release_year, 
  primary_genre_id, mood_tags, decade, duration_seconds, artwork_url, 
  playback_provider, provider_video_id, attribution, metadata_verification_status, 
  publication_status, play_count, is_featured, featured_order, created_at, updated_at
) VALUES
  (201, 'Gajalu Ti Thula Thula', 'गजलु ती ठूला ठूला', 'Gajalu Ti Thula Thula', 60, '', 1985, 5, '["romantic", "nostalgic", "classic"]'::jsonb, '1980s', 294, '', 'youtube', '', '', 'verified', 'published', 15, false, 0, NOW(), NOW()),
  (202, 'Yo Samjhine Mann Chha', 'यो सम्झिने मन छ', 'Yo Samjhine Mann Chha', 1, '', 1990, 5, '["romantic", "emotional", "classic"]'::jsonb, '1990s', 303, '', 'youtube', '', '', 'verified', 'published', 25, true, 1, NOW(), NOW()),
  (203, 'Yati Chokho Yati Mitho', 'यति चोखो यति मिठो', 'Yati Chokho Yati Mitho', 61, '', 1995, 5, '["romantic", "melodic", "remake"]'::jsonb, '1990s', 306, '', 'youtube', '', '', 'verified', 'published', 12, false, 0, NOW(), NOW()),
  (204, 'Malai Nasodha', 'मलाई नसोध', 'Malai Nasodha', 1, '', 1988, 5, '["romantic", "emotional", "classic"]'::jsonb, '1980s', 244, '', 'youtube', '', '', 'verified', 'published', 30, true, 2, NOW(), NOW()),
  (205, 'Deuralima Batas', 'डुमरेलीमा बातास', 'Deuralima Batas', 62, '13', 1985, 5, '["romantic", "nostalgic", "classic"]'::jsonb, '1980s', 262, '', 'youtube', '', '', 'verified', 'published', 18, false, 0, NOW(), NOW()),
  (206, 'Para Laijau Phoolharu', 'पर लैजाऊ फूलहरू', 'Para Laijau Phoolharu', 13, '', 1975, 5, '["romantic", "classic", "golden-era"]'::jsonb, '1970s', 288, '', 'youtube', '', '', 'verified', 'published', 22, false, 0, NOW(), NOW()),
  (207, 'Tadha Tadha Janu Chha Sathi', 'टाढा टाढा जानु छ साथी', 'Tadha Tadha Janu Chha Sathi', 30, '', 1990, 5, '["romantic", "friendship", "classic"]'::jsonb, '1990s', 216, '', 'youtube', '', 'FUNMANDU', 'verified', 'published', 14, false, 0, NOW(), NOW()),
  (208, 'Iisarale Bolaunu', 'ईसराले बोलाउनु', 'Iisarale Bolaunu', 63, '64', 1980, 5, '["romantic", "duet", "classic"]'::jsonb, '1980s', 259, '', 'youtube', '', '', 'verified', 'published', 10, false, 0, NOW(), NOW()),
  (209, 'Timile Ta Hoina Timra', 'तिमीले त होइन तिम्रा', 'Timile Ta Hoina Timra', 30, '', 1992, 5, '["romantic", "emotional", "classic"]'::jsonb, '1990s', 262, '', 'youtube', '', '', 'verified', 'published', 16, false, 0, NOW(), NOW()),
  (210, 'Arabau Manchhe Haruma', 'अरबौ मान्छेहरूमा', 'Arabau Manchhe Haruma', 16, '', 2008, 4, '["humor", "social", "contemporary"]'::jsonb, '2000s', 329, '', 'youtube', '', '', 'verified', 'published', 20, false, 0, NOW(), NOW()),
  (211, 'Yesto Pani Hudo Raichha', 'यस्तो पनि हुन्थ्यो रहेछ', 'Yesto Pani Hudo Raichha', 66, '', 2007, 4, '["humor", "folk", "contemporary"]'::jsonb, '2000s', 233, '', 'youtube', '', '', 'verified', 'published', 18, false, 0, NOW(), NOW()),
  (212, 'Timilai Dekher Aankha', 'तिमीलाई देखेर आँखा', 'Timilai Dekher Aankha', 67, '', 1995, 5, '["romantic", "melodic", "classic"]'::jsonb, '1990s', 194, '', 'youtube', '', '', 'verified', 'published', 28, true, 3, NOW(), NOW()),
  (213, 'Yo Naniko Shiraimaa', 'यो नानीको शिरैँमा', 'Yo Naniko Shiraimaa', 13, '', 2008, 5, '["romantic", "classic", "golden-era"]'::jsonb, '1970s', 284, '', 'youtube', '', '', 'verified', 'published', 19, false, 0, NOW(), NOW()),
  (214, 'Pohor Saal Khusi', 'पोहोर साल खुशी', 'Pohor Saal Khusi', 3, '', 1980, 3, '["upbeat", "celebration", "classic"]'::jsonb, '1980s', 208, '', 'youtube', '', '', 'verified', 'published', 24, false, 0, NOW(), NOW()),
  (215, 'Lajalu Muskanle Priyase', 'लजालु मुस्कानले प्रियसे', 'Lajalu Muskanle Priyase', 68, '', 2015, 9, '["romantic", "acoustic", "contemporary"]'::jsonb, '2010s', 327, '', 'youtube', '', '', 'verified', 'published', 8, false, 0, NOW(), NOW()),
  (216, 'Luki Luki', 'लुकी लुकी', 'Luki Luki', 69, '', 2010, 6, '["romantic", "pop", "contemporary"]'::jsonb, '2010s', 258, '', 'youtube', '', '', 'verified', 'published', 22, false, 0, NOW(), NOW()),
  (217, 'Chari Udyo Badal Chhunalai', 'चरी उड्यो बादल छुनालाई', 'Chari Udyo Badal Chhunalai', 70, '', 2005, 7, '["rock", "romantic", "contemporary"]'::jsonb, '2000s', 268, '', 'youtube', '', '', 'verified', 'published', 15, false, 0, NOW(), NOW()),
  (218, 'Nashalu Timro Heraile', 'नशालु तिम्रो हेराइले', 'Nashalu Timro Heraile', 71, '', 2000, 5, '["romantic", "emotional", "contemporary"]'::jsonb, '2000s', 261, '', 'youtube', '', '', 'verified', 'published', 12, false, 0, NOW(), NOW()),
  (219, 'Pheri Tyo Din', 'फेरी त्यो दिन', 'Pheri Tyo Din', 72, '', 2012, 6, '["romantic", "nostalgic", "contemporary"]'::jsonb, '2010s', 222, '', 'youtube', '', '', 'verified', 'published', 18, false, 0, NOW(), NOW()),
  (220, 'Tutnu Thiyo Tutyo Mutu', 'टुट्नु थियो टुट्यो मुटु', 'Tutnu Thiyo Tutyo Mutu', 73, '', 2018, 6, '["emotional", "heartbreak", "contemporary"]'::jsonb, '2010s', 253, '', 'youtube', '', '', 'verified', 'published', 10, false, 0, NOW(), NOW()),
  (221, 'Timro Man Badaliye Cha', 'तिम्रो मन बदलिएछ', 'Timro Man Badaliye Cha', 74, '75', 2016, 6, '["romantic", "pop", "duet"]'::jsonb, '2010s', 287, '', 'youtube', '', '', 'verified', 'published', 14, false, 0, NOW(), NOW()),
  (222, 'Maan Ko Nischalata Ma', 'मानको निश्चलतामा', 'Maan Ko Nischalata Ma', 2, '', 1970, 5, '["classic", "golden-era", "emotional"]'::jsonb, '1970s', 315, '', 'youtube', '', '', 'verified', 'published', 26, true, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update the songs sequence
SELECT setval(pg_get_serial_sequence('public.songs', 'id'), (SELECT GREATEST(MAX(id), 222) FROM public.songs));

commit;
