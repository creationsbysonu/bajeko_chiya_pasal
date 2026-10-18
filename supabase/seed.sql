-- Bajeko Chiya Pasal — seed.sql
-- Generated from the legacy dev catalog (legacy-dev-catalog.sqlite3) by
-- supabase/tools/generate_seed.py. Safe to re-run only on an empty
-- database; ids are pinned so foreign keys line up.

begin;

insert into public.genre_categories (id, slug, name, name_ne, description, display_order, is_active, created_at) values
(1, 'classical_traditional', 'Classical & Traditional', 'शास्त्रीय तथा परम्परागत', 'Classical raagas, bhajans, and orchestral heritage.', 1, true, '2026-10-12T01:50:40.810484'),
(2, 'folk', 'Folk & Lok Dohori', 'लोक तथा दोहोरी', 'Folk melodies and conversational lok dohori duets.', 2, true, '2026-10-12T01:50:40.811032'),
(3, 'popular', 'Popular & Contemporary', 'लोकप्रिय तथा समकालीन', 'Adhunik, pop, rock, hip-hop and Nepali film songs.', 3, true, '2026-10-12T01:50:40.811425'),
(4, 'regional', 'Regional & Indigenous', 'क्षेत्रीय तथा आदिवासी', 'Tamang Selo, Newa heritage and other regional traditions.', 4, true, '2026-10-12T01:50:40.811769'),
(5, 'special', 'Festive & Seasonal', 'चाडपर्व र मौसमी', 'Dashain, Tihar and other seasonal celebrations.', 5, true, '2026-10-12T01:50:40.812101');
select setval(pg_get_serial_sequence('public.genre_categories', 'id'), (select max(id) from public.genre_categories));

insert into public.genres (id, name, name_ne, slug, category, description, is_active, created_at) values
(1, 'Nepali Classical', 'नेपाली शास्त्रीय संगीत', 'nepali-classical', 'classical_traditional', 'Classical raagas and orchestral heritage', true, '2026-10-09T06:38:50.876372'),
(2, 'Folk Instrumental', 'लोक वाद्यवादन', 'folk-instrumental', 'classical_traditional', 'Traditional Sarangi, Bansuri, Madal instrumental', true, '2026-10-09T06:38:50.878113'),
(3, 'Nepali Lok Geet', 'नेपाली लोक गीत', 'nepali-lok-geet', 'folk', 'Authentic traditional Nepali folk melodies', true, '2026-10-09T06:38:50.880553'),
(4, 'Lok Dohori', 'लोक दोहोरी', 'lok-dohori', 'folk', 'Conversational and duet folk songs of the hills and plains', true, '2026-10-09T06:38:50.881885'),
(5, 'Adhunik Geet', 'आधुनिक गीत', 'adhunik-geet', 'popular', 'Golden era modern sentimental compositions', true, '2026-10-09T06:38:50.883448'),
(6, 'Nepali Pop', 'नेपाली पप', 'nepali-pop', 'popular', 'Melodic pop rhythms of Nepal', true, '2026-10-09T06:38:50.884642'),
(7, 'Nepali Rock', 'नेपाली रक', 'nepali-rock', 'popular', 'Pioneering rock and folk-rock movements', true, '2026-10-09T06:38:50.885837'),
(8, 'Film Songs', 'नेपाली चलचित्र गीत', 'film-songs', 'popular', 'Iconic tracks from classic and modern Nepali cinema', true, '2026-10-09T06:38:50.886829'),
(9, 'Acoustic & Indie', 'एकौस्टिक तथा इन्डी', 'acoustic-indie', 'popular', 'Warm unplugged guitar and soulful vocals', true, '2026-10-09T06:38:50.887702'),
(10, 'Festive & Seasonal', 'चाडपर्व र मौसमी धुन', 'festive-seasonal', 'special', 'Dashain Malshree, Tihar Bhailo, and seasonal celebrations', true, '2026-10-09T06:38:50.888567'),
(11, 'Tamang Selo', 'तामाङ सेलो', 'tamang-selo', 'regional', 'Lively rhythm rooted in Damphu and Himalayan heritage', true, '2026-10-09T06:38:50.889763'),
(12, 'Newa Heritage', 'नेवाः संगीत', 'newa-heritage', 'regional', 'Traditional Newari music, Dhimay, and Dapha', true, '2026-10-09T06:38:50.890624'),
(13, 'Nepali Bhajan', 'नेपाली भजन', 'nepali-bhajan', 'classical_traditional', 'Devotional bhajans, aartis, and spiritual classics', true, '2026-10-11T07:27:37.367349'),
(14, 'Nepali Hip-Hop', 'नेपाली हिप-हप', 'nepali-hiphop', 'popular', 'Nephop rap, urban flows, and hip-hop movement', true, '2026-10-11T07:27:37.369846');
select setval(pg_get_serial_sequence('public.genres', 'id'), (select max(id) from public.genres));

insert into public.artists (id, display_name, display_name_ne, biography, biography_ne, profile_image, verification_status, created_at, updated_at) values
(1, 'Narayan Gopal', 'नारायण गोपाल', 'Swor Samrat (Emperor of Voice), legendary figure in Nepali music.', '', '', 'verified', '2026-10-09T06:38:50.891620', '2026-10-09T06:38:50.891630'),
(2, 'Tara Devi', 'तारा देवी', 'Nightingale of Nepal (Swor Kinnari), celebrated singer of historic melodies.', '', '', 'verified', '2026-10-09T06:38:50.892718', '2026-10-09T06:38:50.892729'),
(3, 'Aruna Lama', 'अरुणा लामा', 'Nightingale of the Hills, renowned for deeply emotional melodies.', '', '', 'verified', '2026-10-09T06:38:50.894181', '2026-10-09T06:38:50.894189'),
(4, 'Bhakta Raj Acharya', 'भक्तराज आचार्य', 'Bhajan Shiromani, master of devotional and melancholic modern classics.', '', '', 'verified', '2026-10-09T06:38:50.895375', '2026-10-09T06:38:50.895384'),
(5, 'Nepathya', 'नेपथ्य', 'Pioneering folk-rock band led by Amrit Gurung connecting Nepal through music.', '', '', 'verified', '2026-10-09T06:38:50.897081', '2026-10-09T06:38:50.897088'),
(6, '1974 AD', '१९७४ एडी', 'Iconic Nepali rock band blending folk instruments with rock sound.', '', '', 'verified', '2026-10-09T06:38:50.898390', '2026-10-09T06:38:50.898397'),
(7, 'Ani Choying Drolma', 'आनी छोइङ डोल्मा', 'Internationally celebrated Buddhist nun and soulful vocalist.', '', '', 'verified', '2026-10-09T06:38:50.899515', '2026-10-09T06:38:50.899523'),
(8, 'Bishnu Majhi', 'विष्णु माझी', 'Revered queen of Nepali Lok Dohori and folk songs.', '', '', 'verified', '2026-10-09T06:38:50.900344', '2026-10-09T06:38:50.900351'),
(9, 'Ambar Gurung', 'अम्बर गुरुङ', 'Composer, lyricist, and doyen of orchestral Nepali music.', '', '', 'verified', '2026-10-09T06:38:50.901130', '2026-10-09T06:38:50.901137'),
(10, 'Gopal Yonzon', 'गोपाल योन्जन', 'Composer and musician who shaped modern Nepali music identity.', '', '', 'verified', '2026-10-09T06:38:50.901924', '2026-10-09T06:38:50.901930'),
(11, 'Himalayan Heritage Ensemble', 'हिमालयन हेरिटेज एन्सेम्बल', 'Acoustic masters of traditional Sarangi and Bansuri flute.', '', '', 'official', '2026-10-09T06:38:50.902723', '2026-10-09T06:38:50.902729'),
(12, 'Rajan Ishan', 'राजन ईशान', 'Versatile singer-composer of melodious adhunik and pop hits since the late 1990s.', '', '', 'verified', '2026-10-11T07:27:37.373138', '2026-10-11T07:27:37.373149'),
(13, 'Prem Dhoj Pradhan', 'प्रेमधोज प्रधान', 'Golden-era maestro (1938-2021) who sang over 700 songs in Nepali and Nepal Bhasa.', '', '', 'verified', '2026-10-11T07:27:37.374387', '2026-10-11T07:27:37.374398'),
(14, 'Nima Rumba', 'निमा रम्बा', 'Popular pop and Tamang selo singer known for melodic hits since the 1990s.', '', '', 'verified', '2026-10-11T07:27:37.375269', '2026-10-11T07:27:37.375277'),
(15, 'Nepsydaz', 'नेप्सिडाज', 'Pioneering Nepali hip-hop group that shaped the Nephop movement with the album Made in Nepal.', '', '', 'verified', '2026-10-11T07:27:37.376110', '2026-10-11T07:27:37.376117'),
(16, 'Bishwo Dong', 'विश्व डोङ', 'Contemporary Tamang selo artist keeping Damphu rhythms alive for new generations.', '', '', 'verified', '2026-10-11T07:27:37.376902', '2026-10-11T07:27:37.376909'),
(17, 'Ramji Khand', 'रामजी खाँड', 'Hit lok dohori duet singer from the Terai plains.', '', '', 'verified', '2026-10-11T07:27:37.377729', '2026-10-11T07:27:37.377735'),
(18, 'Dharmaraj Pokhrel', 'धर्मराज पोखरेल', 'Popular lok dohori vocalist known for lively conversational duets.', '', '', 'verified', '2026-10-11T07:27:37.378671', '2026-10-11T07:27:37.378677'),
(19, 'Raju Pariyar', 'राजु परियार', 'Legendary lok dohori duet king with a career spanning decades.', '', '', 'verified', '2026-10-11T07:27:37.379448', '2026-10-11T07:27:37.379454'),
(20, 'Purnakala BC', 'पूर्णकला बी.सी.', 'Rising lok dohori and jhyaure singer from the western Terai.', '', '', 'verified', '2026-10-11T07:27:37.380507', '2026-10-11T07:27:37.380518'),
(21, 'Pawan Khadka', 'पवन खड्का', 'Devotional singer and composer of widely loved Nepali bhajans.', '', '', 'verified', '2026-10-11T07:27:37.382165', '2026-10-11T07:27:37.382187'),
(22, 'Satish Maharjan', 'सतीश महर्जन', 'Newari folk-pop singer preserving Nepal Bhasa musical heritage.', '', '', 'verified', '2026-10-11T07:27:37.383331', '2026-10-11T07:27:37.383338'),
(23, 'Ishwor Magiya', 'ईश्वर मगिया', 'Modern Nepal Bhasa (Newari) song artist and presenter.', '', '', 'verified', '2026-10-11T07:27:37.384178', '2026-10-11T07:27:37.384185'),
(24, 'Jeeten Rai', 'जीतेन राय', 'Lok geet singer known for earthy village-life melodies.', '', '', 'verified', '2026-10-11T07:27:37.385222', '2026-10-11T07:27:37.385234'),
(25, 'Arun Upatyaka', 'अरुण उपाध्याय', 'Jhyaure folk artist keeping the traditional dance-song form vibrant.', '', '', 'verified', '2026-10-11T07:27:37.386351', '2026-10-11T07:27:37.386363'),
(26, 'Nawin Kumar Khadka', 'नवीन कुमार खड्का', 'Purbeli jhyaure folk dancer-singer from eastern Nepal.', '', '', 'verified', '2026-10-11T07:27:37.387315', '2026-10-11T07:27:37.387323'),
(27, 'Tika Pun', 'टिका पुन', 'New-generation jhyaure and lok dohori talent.', '', '', 'verified', '2026-10-11T07:27:37.388141', '2026-10-11T07:27:37.388148'),
(28, 'Dekendra Shrestha', 'देखेन्द्र श्रेष्ठ', 'Singer known for heart-touching Dashain and festive songs.', '', '', 'verified', '2026-10-17T08:00:00.000000', '2026-10-17T08:00:00.000000'),
(29, 'Bal Kumar Shrestha', 'बल कुमार श्रेष्ठ', 'Tihar deusi-bhailo singer and folk performer.', '', '', 'verified', '2026-10-17T08:00:00.000000', '2026-10-17T08:00:00.000000'),
(30, 'Shambhu Rai', 'शम्भु राई', 'Original deusi-bhailo vocalist for Music Nepal.', '', '', 'verified', '2026-10-17T08:00:00.000000', '2026-10-17T08:00:00.000000'),
(31, 'Rita Tamang', 'रिता तामाङ', 'Teej and lok geet singer with a soulful voice.', '', '', 'verified', '2026-10-17T08:00:00.000000', '2026-10-17T08:00:00.000000'),
(32, 'Krishna Sapkota', 'कृष्ण सापकोटा', 'New Year and seasonal song singer-songwriter.', '', '', 'verified', '2026-10-17T08:00:00.000000', '2026-10-17T08:00:00.000000'),
(33, 'Anil Gurdhami', 'अनिल गुर्धामी', 'Folk and seasonal songwriter known for New Year greetings.', '', '', 'verified', '2026-10-17T08:00:00.000000', '2026-10-17T08:00:00.000000'),
(34, 'SB Ghising', 'एस.बी. घिसिङ', 'Tamang selo artist featured in modern Lhochhar songs.', '', '', 'verified', '2026-10-17T08:00:00.000000', '2026-10-17T08:00:00.000000');
select setval(pg_get_serial_sequence('public.artists', 'id'), (select max(id) from public.artists));

-- Performers behind the calendar-era festive additions (ids 35-59).
insert into public.artists (id, display_name, display_name_ne, biography, biography_ne, profile_image, verification_status, created_at, updated_at) values
(35, 'Bala Bhattarai', 'बाला भट्टराई', 'Devotional and Chhath-parva singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(36, 'Sharda Sinha', 'शारदा सिन्हा', 'Legendary Mithila folk and Chhath geet singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(37, 'Manoj Thapa Magar', 'मनोज थापा मगर', 'Magar folk singer of Maghi Sankranti songs.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(38, 'Ratan Bharadwaj', 'रतन भारद्वाज', 'Devotional and seasonal bhajan singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(39, 'Durgesh Thapa', 'दुर्गेश थापा', 'Popular folk and festive singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(40, 'Sanu Babu Maharjan', 'सानु बाबु महर्जन', 'Newa holi and folk singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(41, 'Pradip Tiwari', 'प्रदीप तिवारी', 'Ram bhajan and devotional singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(42, 'Nabin Baral', 'नविन बराल', 'Lok bhajan singer known for Ram kirtan.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(43, 'Karma Bahadur Karki', 'कर्म बहादुर कार्की', 'Jhyaure folk singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(44, 'Ashok Pandey', 'अशोक पाण्डे', 'Krishna bhajan singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(45, 'Sagar Khadka', 'सागर खड्का', 'Krishna bhajan and lok devotional performer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(46, 'Shambhu Bhatt', 'शम्भु भट्ट', 'Sudurpashchim Gaura and deuda folk singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(47, 'Ulka Ghimire', 'उल्का घिमिरे', 'Gai Jatra and lok folk singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(48, 'Kuma Sagar', 'कुमा सागर', 'Newa cultural singer-songwriter.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(49, 'Anil Deshemaru', 'अनिल देशेमारु', 'Newa heritage singer of jatra songs.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(50, 'Reema Gurung', 'रीमा गुरुङ', 'Gurung/Tamu Lhosar singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(51, 'Deepak Gurung', 'दीपक गुरुङ', 'Gurung folk and Losar performer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(52, 'Palmu Sherpa', 'पाल्मु शेर्पा', 'Sherpa Losar singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(53, 'Thupte Lama', 'थुप्ते लामा', 'Himalayan Losar singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(54, 'Rajan Raj Shiwakoti', 'राजन राज शिवकोटी', 'Popular composer-singer of festive Newa songs.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(55, 'Niva Dangol', 'निबा डंगोल', 'Newa Yomari Punhi singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(56, 'Adrian Dewan', 'एड्रियन देवान', 'Nepali Christian worship singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(57, 'Munaf Shah', 'मुनाफ शाह', 'Nepali Eid song artist.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(58, 'Jam Voice', 'जम भ्वाइस', 'Nepali Eid nasheed performer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
(59, 'Melina Rai', 'मेलिना राई', 'Kirat Ubhauli (Sakela) singer.', '', '', 'verified', '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000');
select setval(pg_get_serial_sequence('public.artists', 'id'), (select max(id) from public.artists));

insert into public.songs (id, title, title_ne, romanized_title, artist_id, featured_artists, composer, lyricist, album, film_or_source, release_year, language, primary_genre_id, mood_tags, decade, duration_seconds, artwork_url, playback_provider, provider_video_id, provider_url, source_url, attribution, metadata_verification_status, publication_status, play_count, is_featured, featured_order, created_at, updated_at) values
(1, 'Kehi Mitho Baat Gara', 'केही मीठो बात गर', 'Kehi Mitho Baat Gara', 1, '', 'Narayan Gopal', 'Kali Prasad Rijal', '', '', 1980, 'Nepali', 5, '["romantic", "nostalgic", "night"]'::jsonb, '1980s', null, 'https://img.youtube.com/vi/5GwJXq3Jva4/hqdefault.jpg', 'youtube', '5GwJXq3Jva4', 'https://www.youtube.com/watch?v=5GwJXq3Jva4', 'https://www.youtube.com/watch?v=5GwJXq3Jva4', 'Music Nepal / Narayan Gopal Official Archives', 'verified', 'published', 29, false, 0, '2026-10-09T06:38:50.904107', '2026-10-11T07:58:55.497884'),
(2, 'Mohani Lagla Hai', 'मोहनी लाग्ला है', 'Mohani Lagla Hai Gauleko Bolile', 1, '', 'Ranjit Gazmer', 'Kusumakar Bhattarai', '', 'Chino (Classic Film)', 1991, 'Nepali', 8, '["nostalgic", "joyful", "travel"]'::jsonb, '1990s', null, 'https://img.youtube.com/vi/KyjRmd4gVOk/hqdefault.jpg', 'youtube', 'KyjRmd4gVOk', 'https://www.youtube.com/watch?v=KyjRmd4gVOk', 'https://www.youtube.com/watch?v=KyjRmd4gVOk', 'Music Nepal Official Film Collection', 'verified', 'published', 0, false, 0, '2026-10-09T06:38:50.905660', '2026-10-11T07:58:55.498816'),
(3, 'Ukali Orali Gardai', 'उकाली ओराली गर्दै', 'Ukali Orali Gardai', 2, '', 'Gopal Yonzon', 'Chandani Shah', '', '', 1974, 'Nepali', 5, '["peaceful", "travel", "nostalgic"]'::jsonb, '1970s', null, 'https://img.youtube.com/vi/kAAjnLlO05M/hqdefault.jpg', 'youtube', 'kAAjnLlO05M', 'https://www.youtube.com/watch?v=kAAjnLlO05M', 'https://www.youtube.com/watch?v=kAAjnLlO05M', 'Tara Devi Memorial / Radio Nepal Archives', 'verified', 'published', 0, false, 0, '2026-10-09T06:38:50.906974', '2026-10-11T07:58:55.499503'),
(4, 'Pohor Saal Khusi Phatyo', 'पोहोर साल खुशी फाट्यो', 'Pohor Saal Khusi Phatyo Jatan Garya', 3, '', 'Karma Yonzon', 'Rajendra Thapa', '', '', 1982, 'Nepali', 5, '["melancholic", "emotional", "rainy"]'::jsonb, '1980s', null, 'https://img.youtube.com/vi/8uIaRZrB6Jk/hqdefault.jpg', 'youtube', '8uIaRZrB6Jk', 'https://www.youtube.com/watch?v=8uIaRZrB6Jk', 'https://www.youtube.com/watch?v=8uIaRZrB6Jk', 'Aruna Lama Official Catalog / Music Nepal', 'verified', 'published', 7, false, 0, '2026-10-09T06:38:50.908391', '2026-10-11T07:58:55.500143'),
(5, 'Kaha Kaha Thaki Sakeko Chhu', 'कहाँ कहाँ थकी सकेको छु', 'Kaha Kaha Thaki Sakeko Chhu', 4, '', 'Bhakta Raj Acharya', 'Bhakta Raj Acharya', '', '', 1985, 'Nepali', 5, '["melancholic", "peaceful", "evening"]'::jsonb, '1980s', null, 'https://img.youtube.com/vi/Xa4jwJqQYAI/hqdefault.jpg', 'youtube', 'Xa4jwJqQYAI', 'https://www.youtube.com/watch?v=Xa4jwJqQYAI', 'https://www.youtube.com/watch?v=Xa4jwJqQYAI', 'Bhakta Raj Acharya Foundation', 'verified', 'published', 0, false, 0, '2026-10-09T06:38:50.909736', '2026-10-11T07:58:55.500774'),
(6, 'Chhekyo Chhekyo', 'छेकेर छेकेन', 'Chhekyo Chhekyo Deurali Danda', 5, '', 'Nepathya', 'Shukra Rai', 'Himal Chuli', '', 1993, 'Nepali', 7, '["travel", "energetic", "bus_highway"]'::jsonb, '1990s', null, 'https://img.youtube.com/vi/FIFnap6epu0/hqdefault.jpg', 'youtube', 'FIFnap6epu0', 'https://www.youtube.com/watch?v=FIFnap6epu0', 'https://www.youtube.com/watch?v=FIFnap6epu0', 'Nepathya Official YouTube Channel', 'verified', 'published', 20, false, 0, '2026-10-09T06:38:50.911531', '2026-10-11T07:58:55.501476'),
(7, 'Resham', 'रेशम', 'Resham Firiri', 5, '', 'Nepathya', 'Traditional folk', 'Resham', '', 2001, 'Nepali', 7, '["travel", "mountain", "energetic"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/BpeFXed4K6I/hqdefault.jpg', 'youtube', 'BpeFXed4K6I', 'https://www.youtube.com/watch?v=BpeFXed4K6I', 'https://www.youtube.com/watch?v=BpeFXed4K6I', 'Nepathya Official YouTube Channel', 'verified', 'published', 0, false, 0, '2026-10-09T06:38:50.913000', '2026-10-11T07:58:55.502145'),
(8, 'Phoolko Aankhama', 'फूलको आँखामा फूलै संसार', 'Phoolko Aankhama Phoolai Sansara', 7, '', 'Nhyoo Bajracharya', 'Durga Lal Shrestha', 'Moments of Bliss', '', 2004, 'Nepali', 9, '["peaceful", "spiritual", "morning"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/bJNLrJ7MUzM/hqdefault.jpg', 'youtube', 'bJNLrJ7MUzM', 'https://www.youtube.com/watch?v=bJNLrJ7MUzM', 'https://www.youtube.com/watch?v=bJNLrJ7MUzM', 'Ani Choying Drolma Official', 'verified', 'published', 13, false, 0, '2026-10-09T06:38:50.914372', '2026-10-11T07:58:55.502931'),
(9, 'Samjhi Baschu', 'सम्झी बस्छु', 'Samjhi Baschu Ma Timilai', 6, '', '1974 AD', 'Phiroj Shyangden', 'Samjhi Baschu', '', 1998, 'Nepali', 7, '["nostalgic", "night", "romantic"]'::jsonb, '1990s', null, 'https://img.youtube.com/vi/RvPiA8U2UcQ/hqdefault.jpg', 'youtube', 'RvPiA8U2UcQ', 'https://www.youtube.com/watch?v=RvPiA8U2UcQ', 'https://www.youtube.com/watch?v=RvPiA8U2UcQ', '1974 AD Official Music Nepal', 'verified', 'published', 0, false, 0, '2026-10-09T06:38:50.916129', '2026-10-11T07:58:55.503675'),
(10, 'Pahilo Junima', 'पहिलो जुनीमा', 'Pahilo Junima Timro Bhanna Nasake Pani', 6, '', '1974 AD', 'Phiroj Shyangden', 'Pinjada Ko Suga', '', 2002, 'Nepali', 9, '["romantic", "acoustic", "evening"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/1tRHOkXkxyA/hqdefault.jpg', 'youtube', '1tRHOkXkxyA', 'https://www.youtube.com/watch?v=1tRHOkXkxyA', 'https://www.youtube.com/watch?v=1tRHOkXkxyA', '1974 AD Official Music Channel', 'verified', 'published', 0, false, 0, '2026-10-09T06:38:50.917441', '2026-10-11T07:58:55.504347'),
(11, 'Gurasai Phulyo', 'गुराँसै फुल्यो वनैमा', 'Gurasai Phulyo Banai Ma', 6, '', '1974 AD', 'Phiroj Shyangden', 'Time Out', '', 1996, 'Nepali', 7, '["travel", "hills", "uplifting"]'::jsonb, '1990s', null, 'https://img.youtube.com/vi/NlBItVRVad0/hqdefault.jpg', 'youtube', 'NlBItVRVad0', 'https://www.youtube.com/watch?v=NlBItVRVad0', 'https://www.youtube.com/watch?v=NlBItVRVad0', '1974 AD Official', 'verified', 'published', 0, false, 0, '2026-10-09T06:38:50.918907', '2026-10-11T07:58:55.505007'),
(12, 'Chari Jailaima', 'चरी जेलैमा', 'Chari Jailaima Teja Ko Barsa', 8, '', 'Shiva Hamal', 'Shiva Hamal', 'Sapana Ko Mayalu', '', 2021, 'Nepali', 4, '["festive", "emotional", "teej"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/lsKAqFo0Yck/hqdefault.jpg', 'youtube', 'lsKAqFo0Yck', 'https://www.youtube.com/watch?v=lsKAqFo0Yck', 'https://www.youtube.com/watch?v=lsKAqFo0Yck', 'Sapana Music / Bishnu Majhi Official', 'verified', 'published', 7, false, 0, '2026-10-09T06:38:50.920292', '2026-10-11T07:58:55.505659'),
(13, 'Malshree Dhun (Dashain)', 'मालश्री धुन (दशैं विशेष)', 'Malshree Dhun Dashain Instrumental', 11, '', 'Traditional heritage', 'Instrumental', '', '', 1970, 'Nepali', 10, '["festive", "dashain", "traditional"]'::jsonb, '1970s', null, 'https://img.youtube.com/vi/OhS7Vag5D4Q/hqdefault.jpg', 'youtube', 'OhS7Vag5D4Q', 'https://www.youtube.com/watch?v=OhS7Vag5D4Q', 'https://www.youtube.com/watch?v=OhS7Vag5D4Q', 'Nepal Traditional Heritage Arts', 'verified', 'published', 13, false, 0, '2026-10-09T06:38:50.921603', '2026-10-11T07:58:55.506480'),
(14, 'Himalayan Bansuri Meditation', 'हिमाली बाँसुरी धुन', 'Himalayan Bansuri Flute Peaceful Melodies', 11, '', 'Traditional folk', 'Instrumental', '', '', 2015, 'Nepali', 2, '["peaceful", "meditation", "mountain"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/NtMburJ5zOc/hqdefault.jpg', 'youtube', 'NtMburJ5zOc', 'https://www.youtube.com/watch?v=NtMburJ5zOc', 'https://www.youtube.com/watch?v=NtMburJ5zOc', 'Acoustic Nepal Heritage Archives', 'verified', 'published', 0, false, 0, '2026-10-09T06:38:50.925396', '2026-10-11T07:58:55.507220'),
(15, 'Mutu Bhari Bhari', 'मुटु भरि भरि', 'Mutu Bhari Bhari Timrai Maya Chha', 4, '', 'Bhakta Raj Acharya', 'Bhakta Raj Acharya', '', '', 1983, 'Nepali', 5, '["melancholic", "romantic", "night"]'::jsonb, '1980s', null, 'https://img.youtube.com/vi/CICUUy22JpY/hqdefault.jpg', 'youtube', 'CICUUy22JpY', 'https://www.youtube.com/watch?v=CICUUy22JpY', 'https://www.youtube.com/watch?v=CICUUy22JpY', 'Music Nepal Archival Preservation', 'verified', 'published', 0, false, 0, '2026-10-09T06:38:50.926730', '2026-10-11T07:58:55.507909'),
(16, 'Timro Mayale Badhera Rakha', 'तिम्रो मायाले बाँधेर राख', 'Timro Mayale Bandhera Rakha', 2, '', 'Natikaji', 'Ratna Shumsher Thapa', '', '', 1968, 'Nepali', 5, '["romantic", "vintage", "golden_era"]'::jsonb, '1960s', null, 'https://img.youtube.com/vi/04cL3gTS_94/hqdefault.jpg', 'youtube', '04cL3gTS_94', 'https://www.youtube.com/watch?v=04cL3gTS_94', 'https://www.youtube.com/watch?v=04cL3gTS_94', 'Radio Nepal / Music Nepal Archives', 'verified', 'published', 0, false, 0, '2026-10-09T06:38:50.928249', '2026-10-11T07:58:55.508589'),
(36, 'Dashain Ko Diyo', 'दशैंको दियो', 'Dashain Ko Diyo', 11, '', 'Traditional heritage', 'Instrumental', '', '', 2012, 'Nepali', 10, '["festive", "dashain", "traditional"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/OhS7Vag5D4Q/hqdefault.jpg', 'youtube', 'OhS7Vag5D4Q', 'https://www.youtube.com/watch?v=OhS7Vag5D4Q', 'https://www.youtube.com/watch?v=OhS7Vag5D4Q', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T02:47:24.349408', '2026-10-10T02:55:47.074741'),
(37, 'Bansuri Ko Sur', 'बाँसुरीको सुर', 'Bansuri Ko Sur', 11, '', 'Traditional folk', 'Instrumental', '', '', 2014, 'Nepali', 2, '["peaceful", "meditation", "mountain"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/NtMburJ5zOc/hqdefault.jpg', 'youtube', 'NtMburJ5zOc', 'https://www.youtube.com/watch?v=NtMburJ5zOc', 'https://www.youtube.com/watch?v=NtMburJ5zOc', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T02:47:24.351220', '2026-10-10T02:55:47.076038'),
(38, 'Teej Ko Geet', 'तीजको गीत', 'Teej Ko Geet', 8, '', 'Shiva Hamal', 'Shiva Hamal', '', '', 2020, 'Nepali', 4, '["festive", "emotional", "teej"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/lsKAqFo0Yck/hqdefault.jpg', 'youtube', 'lsKAqFo0Yck', 'https://www.youtube.com/watch?v=lsKAqFo0Yck', 'https://www.youtube.com/watch?v=lsKAqFo0Yck', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T02:47:24.352590', '2026-10-10T02:55:47.077380'),
(76, 'Maya Ko Ghar', 'मायाको घर', 'Maya Ko Ghar Evening Edit', 1, '', 'Narayan Gopal', 'Kali Prasad Rijal', '', '', 1981, 'Nepali', 5, '["romantic", "warm", "evening"]'::jsonb, '1980s', null, 'https://img.youtube.com/vi/5GwJXq3Jva4/hqdefault.jpg', 'youtube', '5GwJXq3Jva4', 'https://www.youtube.com/watch?v=5GwJXq3Jva4', 'https://www.youtube.com/watch?v=5GwJXq3Jva4', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T02:55:47.147448', '2026-10-10T02:55:47.147455'),
(97, 'Yo Samjhine Man Chha', 'यो सम्झिने मन छ', 'Yo Samjhine Man Chha', 1, '', 'Narayan Gopal', 'Kali Prasad Rijal', '', '', 1984, 'Nepali', 5, '["nostalgic", "romantic", "classic"]'::jsonb, '1980s', null, 'https://img.youtube.com/vi/5GwJXq3Jva4/hqdefault.jpg', 'youtube', '5GwJXq3Jva4', 'https://www.youtube.com/watch?v=5GwJXq3Jva4', 'https://www.youtube.com/watch?v=5GwJXq3Jva4', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.307845', '2026-10-11T07:58:55.509296'),
(98, 'Aankhama Timi', 'आँखामा तिमी', 'Aankhama Timi', 2, '', 'Gopal Yonzon', 'Chandani Shah', '', '', 1978, 'Nepali', 5, '["romantic", "nostalgic", "moonlit"]'::jsonb, '1970s', null, 'https://img.youtube.com/vi/04cL3gTS_94/hqdefault.jpg', 'youtube', '04cL3gTS_94', 'https://www.youtube.com/watch?v=04cL3gTS_94', 'https://www.youtube.com/watch?v=04cL3gTS_94', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.310104', '2026-10-11T07:58:55.509933'),
(99, 'Bato Ko Sangeet', 'बाटोको संगीत', 'Bato Ko Sangeet', 5, '', 'Nepathya', 'Amrit Gurung', '', '', 1998, 'Nepali', 7, '["travel", "energetic", "road"]'::jsonb, '1990s', null, 'https://img.youtube.com/vi/FIFnap6epu0/hqdefault.jpg', 'youtube', 'FIFnap6epu0', 'https://www.youtube.com/watch?v=FIFnap6epu0', 'https://www.youtube.com/watch?v=FIFnap6epu0', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.311557', '2026-10-11T07:58:55.510629'),
(100, 'Udaan', 'उडान', 'Udaan', 6, '', '1974 AD', 'Phiroj Shyangden', '', '', 2004, 'Nepali', 7, '["uplifting", "anthemic", "open-road"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/NlBItVRVad0/hqdefault.jpg', 'youtube', 'NlBItVRVad0', 'https://www.youtube.com/watch?v=NlBItVRVad0', 'https://www.youtube.com/watch?v=NlBItVRVad0', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.312869', '2026-10-11T07:58:55.511244'),
(101, 'Madal Ko Dhun', 'मादलको धुन', 'Madal Ko Dhun', 8, '', 'Shiva Hamal', 'Shiva Hamal', '', '', 2022, 'Nepali', 4, '["festive", "dance", "folk"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/lsKAqFo0Yck/hqdefault.jpg', 'youtube', 'lsKAqFo0Yck', 'https://www.youtube.com/watch?v=lsKAqFo0Yck', 'https://www.youtube.com/watch?v=lsKAqFo0Yck', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.314278', '2026-10-11T07:58:55.511846'),
(102, 'Eklo Raat', 'एक्लो रात', 'Eklo Raat', 4, '', 'Bhakta Raj Acharya', 'Bhakta Raj Acharya', '', '', 1984, 'Nepali', 5, '["melancholic", "rainy", "late-night"]'::jsonb, '1980s', null, 'https://img.youtube.com/vi/8uIaRZrB6Jk/hqdefault.jpg', 'youtube', '8uIaRZrB6Jk', 'https://www.youtube.com/watch?v=8uIaRZrB6Jk', 'https://www.youtube.com/watch?v=8uIaRZrB6Jk', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.315733', '2026-10-11T07:58:55.512491'),
(103, 'Deusi Bhailo Utsav', 'देउसी भैलो उत्सव', 'Deusi Bhailo Utsav', 11, '', 'Traditional heritage', 'Instrumental', '', '', 2018, 'Nepali', 10, '["festive", "community", "autumn"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/OhS7Vag5D4Q/hqdefault.jpg', 'youtube', 'OhS7Vag5D4Q', 'https://www.youtube.com/watch?v=OhS7Vag5D4Q', 'https://www.youtube.com/watch?v=OhS7Vag5D4Q', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.317430', '2026-10-11T07:58:55.513369'),
(104, 'Shanta Pahad', 'शान्त पहाड', 'Shanta Pahad', 11, '', 'Traditional folk', 'Instrumental', '', '', 2016, 'Nepali', 2, '["peaceful", "mountain", "breathing_space"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/NtMburJ5zOc/hqdefault.jpg', 'youtube', 'NtMburJ5zOc', 'https://www.youtube.com/watch?v=NtMburJ5zOc', 'https://www.youtube.com/watch?v=NtMburJ5zOc', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.318978', '2026-10-11T07:58:55.514184'),
(105, 'Saanjh Ko Aago', 'साँझको आगो', 'Saanjh Ko Aago', 7, '', 'Nhyoo Bajracharya', 'Durga Lal Shrestha', 'Moments of Bliss', '', 2004, 'Nepali', 9, '["peaceful", "spiritual", "evening"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/bJNLrJ7MUzM/hqdefault.jpg', 'youtube', 'bJNLrJ7MUzM', 'https://www.youtube.com/watch?v=bJNLrJ7MUzM', 'https://www.youtube.com/watch?v=bJNLrJ7MUzM', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.320408', '2026-10-11T07:58:55.514857'),
(106, 'Kathmandu Blues', 'काठमाडौं ब्लुज', 'Kathmandu Blues', 5, '', 'Nepathya', 'Amrit Gurung', '', '', 2001, 'Nepali', 7, '["city", "travel", "energetic"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/BpeFXed4K6I/hqdefault.jpg', 'youtube', 'BpeFXed4K6I', 'https://www.youtube.com/watch?v=BpeFXed4K6I', 'https://www.youtube.com/watch?v=BpeFXed4K6I', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.321752', '2026-10-11T07:58:55.515499'),
(107, 'Sukha Ko Simal', 'सुखको सिमल', 'Sukha Ko Simal', 2, '', 'Gopal Yonzon', 'Chandani Shah', '', '', 1980, 'Nepali', 5, '["romantic", "nostalgic", "warm"]'::jsonb, '1980s', null, 'https://img.youtube.com/vi/kAAjnLlO05M/hqdefault.jpg', 'youtube', 'kAAjnLlO05M', 'https://www.youtube.com/watch?v=kAAjnLlO05M', 'https://www.youtube.com/watch?v=kAAjnLlO05M', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.323056', '2026-10-11T07:58:55.516163'),
(108, 'Himalaya Calling', 'हिमालय कलिङ', 'Himalaya Calling', 6, '', '1974 AD', 'Phiroj Shyangden', '', '', 2002, 'Nepali', 9, '["uplifting", "mountain", "open-road"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/1tRHOkXkxyA/hqdefault.jpg', 'youtube', '1tRHOkXkxyA', 'https://www.youtube.com/watch?v=1tRHOkXkxyA', 'https://www.youtube.com/watch?v=1tRHOkXkxyA', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.324358', '2026-10-11T07:58:55.516802'),
(109, 'Raat Bhari', 'रात भरि', 'Raat Bhari', 3, '', 'Karma Yonzon', 'Rajendra Thapa', '', '', 1982, 'Nepali', 5, '["melancholic", "rainy", "night"]'::jsonb, '1980s', null, 'https://img.youtube.com/vi/Xa4jwJqQYAI/hqdefault.jpg', 'youtube', 'Xa4jwJqQYAI', 'https://www.youtube.com/watch?v=Xa4jwJqQYAI', 'https://www.youtube.com/watch?v=Xa4jwJqQYAI', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.325900', '2026-10-11T07:58:55.517520'),
(110, 'Jatra Ko Geet', 'जात्राको गीत', 'Jatra Ko Geet', 11, '', 'Traditional heritage', 'Instrumental', '', '', 1972, 'Nepali', 10, '["festive", "community", "heritage"]'::jsonb, '1970s', null, 'https://img.youtube.com/vi/OhS7Vag5D4Q/hqdefault.jpg', 'youtube', 'OhS7Vag5D4Q', 'https://www.youtube.com/watch?v=OhS7Vag5D4Q', 'https://www.youtube.com/watch?v=OhS7Vag5D4Q', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.327333', '2026-10-11T07:58:55.518135'),
(111, 'Bansuri Ra Ghumto', 'बाँसुरी र घुम्टो', 'Bansuri Ra Ghumto', 11, '', 'Traditional folk', 'Instrumental', '', '', 2015, 'Nepali', 2, '["peaceful", "mountain", "meditation"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/NtMburJ5zOc/hqdefault.jpg', 'youtube', 'NtMburJ5zOc', 'https://www.youtube.com/watch?v=NtMburJ5zOc', 'https://www.youtube.com/watch?v=NtMburJ5zOc', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.328831', '2026-10-11T07:58:55.518865'),
(112, 'Mero Prem Geet', 'मेरो प्रेम गीत', 'Mero Prem Geet', 1, '', 'Narayan Gopal', 'Kali Prasad Rijal', '', '', 1981, 'Nepali', 5, '["romantic", "classic", "warm"]'::jsonb, '1980s', null, 'https://img.youtube.com/vi/5GwJXq3Jva4/hqdefault.jpg', 'youtube', '5GwJXq3Jva4', 'https://www.youtube.com/watch?v=5GwJXq3Jva4', 'https://www.youtube.com/watch?v=5GwJXq3Jva4', 'Bajeko Chiya Pasal archival edit using the official embed', 'verified', 'published', 0, false, 0, '2026-10-10T03:01:58.330309', '2026-10-11T07:58:55.519484'),
(113, 'Euta Manchhe Ko Mayale Kati', 'एउटा मान्छेको मायाले कति', 'Euta Manchhe Ko Mayale Kati', 1, '', 'Deepak Jangam', 'Chandani Shah', '', '', 1991, 'Nepali', 5, '["romantic", "nostalgic", "classic"]'::jsonb, '1990s', null, 'https://img.youtube.com/vi/SZuiQcTPeBA/hqdefault.jpg', 'youtube', 'SZuiQcTPeBA', 'https://www.youtube.com/watch?v=SZuiQcTPeBA', 'https://www.youtube.com/watch?v=SZuiQcTPeBA', 'Narayan Gopal archival audio (public embed)', 'community_submitted', 'published', 0, false, 0, '2026-10-11T07:27:37.438325', '2026-10-11T07:58:55.520099'),
(114, 'Tara Khase Cha', 'तारा खासे छ', 'Tara Khase Cha', 13, '', 'Ambar Gurung', 'Rajendra Thapa', '', '', 1975, 'Nepali', 1, '["classic", "romantic", "golden_era"]'::jsonb, '1970s', null, 'https://img.youtube.com/vi/PutbiMNrllk/hqdefault.jpg', 'youtube', 'PutbiMNrllk', 'https://www.youtube.com/watch?v=PutbiMNrllk', 'https://www.youtube.com/watch?v=PutbiMNrllk', 'Prem Dhoj Pradhan songbook archival recording', 'community_submitted', 'published', 2, false, 0, '2026-10-11T07:27:37.439911', '2026-10-11T07:58:55.520767'),
(115, 'Aaja Feri', 'आज फेरी', 'Aaja Feri', 12, '', 'Rajan Ishan', 'Rajan Ishan', '', '', 1999, 'Nepali', 5, '["romantic", "nostalgic", "classic"]'::jsonb, '1990s', null, 'https://img.youtube.com/vi/dqAnOGIbmdc/hqdefault.jpg', 'youtube', 'dqAnOGIbmdc', 'https://www.youtube.com/watch?v=dqAnOGIbmdc', 'https://www.youtube.com/watch?v=dqAnOGIbmdc', 'Rajan Ishan Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.441259', '2026-10-11T07:58:55.521430'),
(116, 'Najar Ko Pahilo Bhet', 'नजरको पहिलो भेट', 'Najar Ko Pahilo Bhet', 12, 'Nishad Band', 'Nishad Band', 'Rohini Rana', '', '', 2001, 'Nepali', 6, '["romantic", "melodic", "classic"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/NaASLuXLJ-g/hqdefault.jpg', 'youtube', 'NaASLuXLJ-g', 'https://www.youtube.com/watch?v=NaASLuXLJ-g', 'https://www.youtube.com/watch?v=NaASLuXLJ-g', 'Rajan Ishan Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.442585', '2026-10-11T07:58:55.522141'),
(117, 'Kasam Chha', 'कसम छ', 'Kasam Chha', 12, '', 'Rajan Ishan', 'Rohini Rana', '', '', 2005, 'Nepali', 6, '["romantic", "emotional", "melodic"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/kgEnIX0UsMs/hqdefault.jpg', 'youtube', 'kgEnIX0UsMs', 'https://www.youtube.com/watch?v=kgEnIX0UsMs', 'https://www.youtube.com/watch?v=kgEnIX0UsMs', 'Rajan Ishan Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.444121', '2026-10-11T07:58:55.522809'),
(118, 'Maya Oh Maya', 'माया ओ माया', 'Maya Oh Maya', 15, '', 'Nepsydaz', 'Nepsydaz', 'Made in Nepal', '', 2005, 'Nepali', 14, '["rap", "romantic", "urban"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/LasnPICg3xE/hqdefault.jpg', 'youtube', 'LasnPICg3xE', 'https://www.youtube.com/watch?v=LasnPICg3xE', 'https://www.youtube.com/watch?v=LasnPICg3xE', 'Nepsydaz Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.445780', '2026-10-11T07:58:55.523495'),
(119, 'Aaideuna', 'आइदेउना', 'Aaideuna', 15, '', 'Nepsydaz', 'Nepsydaz', '', '', 2004, 'Nepali', 14, '["rap", "nostalgic", "urban"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/7qFkFbHV5G4/hqdefault.jpg', 'youtube', '7qFkFbHV5G4', 'https://www.youtube.com/watch?v=7qFkFbHV5G4', 'https://www.youtube.com/watch?v=7qFkFbHV5G4', 'Nepsydaz archival fan upload (public embed)', 'community_submitted', 'published', 0, false, 0, '2026-10-11T07:27:37.447199', '2026-10-11T07:58:55.524156'),
(120, 'Yo Jindagani', 'यो जिन्दगानी', 'Yo Jindagani', 5, '', 'Nepathya', 'Amrit Gurung', 'Resham', '', 2001, 'Nepali', 7, '["travel", "philosophical", "anthemic"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/sPJrtOfv2Zc/hqdefault.jpg', 'youtube', 'sPJrtOfv2Zc', 'https://www.youtube.com/watch?v=sPJrtOfv2Zc', 'https://www.youtube.com/watch?v=sPJrtOfv2Zc', 'Music Nepal Official / Nepathya', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.448611', '2026-10-11T07:58:55.524779'),
(121, 'Aau Aauna', 'आउ आउन', 'Aau Aauna', 14, '', 'Nima Rumba', 'Nima Rumba', 'Lolita', '', 2002, 'Nepali', 6, '["romantic", "uplifting", "classic"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/VYrYjHaW_Yw/hqdefault.jpg', 'youtube', 'VYrYjHaW_Yw', 'https://www.youtube.com/watch?v=VYrYjHaW_Yw', 'https://www.youtube.com/watch?v=VYrYjHaW_Yw', 'Nima Rumba Official (Music Nepal Topic)', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.449957', '2026-10-11T07:58:55.525376'),
(122, 'Meri Mayalu', 'मेरी मायालु', 'Meri Mayalu', 14, '', 'Maharaj Thapa', 'Naresh Dev Pant', 'Faith', '', 2003, 'Nepali', 6, '["romantic", "melodic", "classic"]'::jsonb, '2000s', null, 'https://img.youtube.com/vi/d6NH0dGR7Vg/hqdefault.jpg', 'youtube', 'd6NH0dGR7Vg', 'https://www.youtube.com/watch?v=d6NH0dGR7Vg', 'https://www.youtube.com/watch?v=d6NH0dGR7Vg', 'Nima Rumba archival audio (MusicMania Nepal)', 'community_submitted', 'published', 0, false, 0, '2026-10-11T07:27:37.451639', '2026-10-11T07:58:55.525987'),
(123, 'Rangau Ki Ma', 'राङ्गाउ की मा', 'Rangau Ki Ma', 14, '', 'Nima Rumba', 'Nima Rumba', '', '', 1998, 'Nepali', 9, '["acoustic", "nostalgic", "peaceful"]'::jsonb, '1990s', null, 'https://img.youtube.com/vi/frUZM3gCL3M/hqdefault.jpg', 'youtube', 'frUZM3gCL3M', 'https://www.youtube.com/watch?v=frUZM3gCL3M', 'https://www.youtube.com/watch?v=frUZM3gCL3M', 'Kripa Unplugged acoustic session (public embed)', 'community_submitted', 'published', 0, false, 0, '2026-10-11T07:27:37.453112', '2026-10-11T07:58:55.526610'),
(124, 'Hoi Lhasso', 'होई ल्हासो', 'Hoi Lhasso', 14, 'Shashikala Moktan, Yogita Moktan', 'Traditional Tamang', 'Traditional Tamang', '', '', 2019, 'Tamang', 11, '["dance", "mountain", "energetic"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/XyXHx8SgytE/hqdefault.jpg', 'youtube', 'XyXHx8SgytE', 'https://www.youtube.com/watch?v=XyXHx8SgytE', 'https://www.youtube.com/watch?v=XyXHx8SgytE', 'Shashikala Moktan Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.454596', '2026-10-11T07:58:55.527224'),
(125, 'Herdama Ramri', 'हेर्दा राम्री', 'Herdama Ramri', 16, 'Kamala Dong, Songmit Theeng', 'Bishwo Dong', 'Bishwo Dong', '', '', 2021, 'Tamang', 11, '["dance", "joyful", "mountain"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/jiXCwDsYeJk/hqdefault.jpg', 'youtube', 'jiXCwDsYeJk', 'https://www.youtube.com/watch?v=jiXCwDsYeJk', 'https://www.youtube.com/watch?v=jiXCwDsYeJk', 'Bishwo Dong Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.456183', '2026-10-11T07:58:55.527894'),
(126, 'Seloma Geet Gaune', 'सेलोमा गीत गाउने', 'Seloma Geet Gaune', 16, 'Sujana Rumba, Anita Gole, Nijal Tamang', 'Bishwo Dong', 'Bishwo Dong', '', '', 2022, 'Tamang', 11, '["dance", "folk", "energetic"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/ZnPTWmdtto0/hqdefault.jpg', 'youtube', 'ZnPTWmdtto0', 'https://www.youtube.com/watch?v=ZnPTWmdtto0', 'https://www.youtube.com/watch?v=ZnPTWmdtto0', 'Bishwo Dong Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.457703', '2026-10-11T07:58:55.528510'),
(127, 'Navana Hai Kasailai', 'नबनाउनु छैन कसैलाई', 'Navana Hai Kasailai', 17, 'Manju Mahat, Muna Thapa', 'Music Nepal', 'Traditional dohori', '', '', 2012, 'Nepali', 4, '["duet", "village", "romantic"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/FdJG3GHeZNo/hqdefault.jpg', 'youtube', 'FdJG3GHeZNo', 'https://www.youtube.com/watch?v=FdJG3GHeZNo', 'https://www.youtube.com/watch?v=FdJG3GHeZNo', 'Music Nepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.459207', '2026-10-11T07:58:55.529177'),
(128, 'Piratiko Gharma', 'पिरतीको घरमा', 'Piratiko Gharma', 17, 'Rafika Dong', 'Music Nepal', 'Traditional dohori', '', '', 2016, 'Nepali', 4, '["duet", "romantic", "emotional"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/WvGRxcNocz0/hqdefault.jpg', 'youtube', 'WvGRxcNocz0', 'https://www.youtube.com/watch?v=WvGRxcNocz0', 'https://www.youtube.com/watch?v=WvGRxcNocz0', 'Music Nepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.460722', '2026-10-11T07:58:55.529844'),
(129, 'Lakhau Hajar Ma', 'लाखौं हजारमा', 'Lakhau Hajar Ma', 18, 'Devi Gharti', 'Music Nepal', 'Traditional dohori', '', '', 2017, 'Nepali', 4, '["duet", "village", "joyful"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/DZw9otqWkfI/hqdefault.jpg', 'youtube', 'DZw9otqWkfI', 'https://www.youtube.com/watch?v=DZw9otqWkfI', 'https://www.youtube.com/watch?v=DZw9otqWkfI', 'Music Nepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.462353', '2026-10-11T07:58:55.530452'),
(130, 'Naroyeka Aankha Haru', 'नरोएका आँखाहरू', 'Naroyeka Aankha Haru', 8, 'Sudip Adhikari', 'Music Nepal', 'Traditional dohori', '', '', 2017, 'Nepali', 4, '["duet", "emotional", "romantic"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/uGrXyYLNpZc/hqdefault.jpg', 'youtube', 'uGrXyYLNpZc', 'https://www.youtube.com/watch?v=uGrXyYLNpZc', 'https://www.youtube.com/watch?v=uGrXyYLNpZc', 'Music Nepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.463718', '2026-10-11T07:58:55.531048'),
(131, 'Shasan', 'शासन', 'Shasan', 8, 'Arjun Kunwar', 'Music Nepal', 'Traditional dohori', '', '', 2018, 'Nepali', 4, '["duet", "folk", "energetic"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/-jijXxSBoxQ/hqdefault.jpg', 'youtube', '-jijXxSBoxQ', 'https://www.youtube.com/watch?v=-jijXxSBoxQ', 'https://www.youtube.com/watch?v=-jijXxSBoxQ', 'Music Nepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.465053', '2026-10-11T07:58:55.531687'),
(132, 'Phool Ma Mahuri', 'फूलमा माहुरी', 'Phool Ma Mahuri', 19, 'Devi Gharti', 'Music Nepal', 'Traditional dohori', '', '', 2013, 'Nepali', 4, '["duet", "classic", "village"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/5oGcms_B8ss/hqdefault.jpg', 'youtube', '5oGcms_B8ss', 'https://www.youtube.com/watch?v=5oGcms_B8ss', 'https://www.youtube.com/watch?v=5oGcms_B8ss', 'Music Nepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.466434', '2026-10-11T07:58:55.532341'),
(133, 'Jhola', 'झोला', 'Jhola', 20, 'Khuman Adhikari, Dhan K.P.', 'Purnakala BC', 'Purnakala BC', '', '', 2019, 'Nepali', 4, '["duet", "village", "joyful"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/xfWtWNlohAU/hqdefault.jpg', 'youtube', 'xfWtWNlohAU', 'https://www.youtube.com/watch?v=xfWtWNlohAU', 'https://www.youtube.com/watch?v=xfWtWNlohAU', 'Purnakala BC Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.467769', '2026-10-11T07:58:55.533015'),
(134, 'Soltijyu Samjhinnau', 'सोल्टीज्यू सम्झिन्नौ', 'Soltijyu Samjhinnau Maile Jhai', 27, '', 'Tika Pun', 'Tika Pun', '', '', 2025, 'Nepali', 4, '["duet", "modern", "folk"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/ANuwUzVocYI/hqdefault.jpg', 'youtube', 'ANuwUzVocYI', 'https://www.youtube.com/watch?v=ANuwUzVocYI', 'https://www.youtube.com/watch?v=ANuwUzVocYI', 'Tika Pun Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.469068', '2026-10-11T07:58:55.533696'),
(135, 'Birahani Jhyaure Lok Dhun', 'बिरहनी झ्याउरे लोक धुन', 'Birahani Jhyaure Lok Dhun', 25, '', 'Arun Upatyaka', 'Arun Upatyaka', '', '', 2022, 'Nepali', 3, '["jhyaure", "emotional", "dance"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/98zWOMdK1XA/hqdefault.jpg', 'youtube', '98zWOMdK1XA', 'https://www.youtube.com/watch?v=98zWOMdK1XA', 'https://www.youtube.com/watch?v=98zWOMdK1XA', 'Music Nepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.470353', '2026-10-11T07:58:55.534323'),
(136, 'Paki Ma Gayo Ni Hau Aamchuri Dana', 'पाकीमा गयो नि हौ आम्चुरी दाना', 'Paki Ma Gayo Ni Hau Aamchuri Dana', 26, '', 'Nawin Kumar Khadka', 'Nawin Kumar Khadka', '', '', 2023, 'Nepali', 3, '["jhyaure", "dance", "festive"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/MAVGRHPlFQI/hqdefault.jpg', 'youtube', 'MAVGRHPlFQI', 'https://www.youtube.com/watch?v=MAVGRHPlFQI', 'https://www.youtube.com/watch?v=MAVGRHPlFQI', 'Music Nepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.471688', '2026-10-11T07:58:55.535025'),
(137, 'Chithhi Lekhaula', 'चिठ्ठी लेखाउलो', 'Chithhi Lekhaula', 24, '', 'Jeeten Rai', 'Jeeten Rai', '', '', 2015, 'Nepali', 3, '["folk", "village", "romantic"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/_dPHqmrlt0A/hqdefault.jpg', 'youtube', '_dPHqmrlt0A', 'https://www.youtube.com/watch?v=_dPHqmrlt0A', 'https://www.youtube.com/watch?v=_dPHqmrlt0A', 'Music Nepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.472988', '2026-10-11T07:58:55.535707'),
(138, 'Bhakta Ra Bhagawan', 'भक्त र भगवान', 'Bhakta Ra Bhagawan', 21, 'Mahalaxmi Risal', 'Pawan Khadka', 'Shivaji Prasad Neupane', '', '', 2022, 'Nepali', 13, '["devotional", "peaceful", "spiritual"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/VfrpKLOEdtc/hqdefault.jpg', 'youtube', 'VfrpKLOEdtc', 'https://www.youtube.com/watch?v=VfrpKLOEdtc', 'https://www.youtube.com/watch?v=VfrpKLOEdtc', 'Pawan Khadka Official', 'verified', 'published', 2, false, 0, '2026-10-11T07:27:37.474287', '2026-10-11T07:58:55.536336'),
(139, 'Jai Mata Laxmi', 'जय माता लक्ष्मी', 'Jai Mata Laxmi', 21, '', 'Pawan Khadka', 'Shivaji Neupane', '', '', 2016, 'Nepali', 13, '["devotional", "festive", "tihar"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/wuARKhskQi0/hqdefault.jpg', 'youtube', 'wuARKhskQi0', 'https://www.youtube.com/watch?v=wuARKhskQi0', 'https://www.youtube.com/watch?v=wuARKhskQi0', 'SongsNepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.475772', '2026-10-11T07:58:55.536944'),
(140, 'Palkha Aase', 'पल्खा आसे', 'Palkha Aase', 22, 'Saraswati Manandhar', 'Music Nepal', 'Traditional Newari', '', '', 2016, 'Newari', 12, '["newari", "folk", "melodic"]'::jsonb, '2010s', null, 'https://img.youtube.com/vi/u4oJDBPl9TY/hqdefault.jpg', 'youtube', 'u4oJDBPl9TY', 'https://www.youtube.com/watch?v=u4oJDBPl9TY', 'https://www.youtube.com/watch?v=u4oJDBPl9TY', 'Music Nepal Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.477289', '2026-10-11T07:58:55.537576'),
(141, 'Haku Parsi Sina', 'हाकु पर्सि सिना', 'Haku Parsi Sina', 23, 'Manoj Maharjan, Hasana Maharjan', 'Ishwor Magiya', 'Ishwor Magiya', '', '', 2025, 'Newari', 12, '["newari", "urban", "modern"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/_wVBrAQa9Ko/hqdefault.jpg', 'youtube', '_wVBrAQa9Ko', 'https://www.youtube.com/watch?v=_wVBrAQa9Ko', 'https://www.youtube.com/watch?v=_wVBrAQa9Ko', 'OSR Movies Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.478655', '2026-10-11T07:58:55.538193'),
(142, 'Dhalan Dane', 'ढलान दाने', 'Dhalan Dane', 23, 'Sanish Maharjan, Shova Maharjan', 'Ishwor Magiya', 'Ishwor Magiya', '', '', 2025, 'Newari', 12, '["newari", "dance", "modern"]'::jsonb, '2020s', null, 'https://img.youtube.com/vi/aDMmwQZvrDc/hqdefault.jpg', 'youtube', 'aDMmwQZvrDc', 'https://www.youtube.com/watch?v=aDMmwQZvrDc', 'https://www.youtube.com/watch?v=aDMmwQZvrDc', 'OSR Movies Official', 'verified', 'published', 0, false, 0, '2026-10-11T07:27:37.480253', '2026-10-11T07:58:55.538884');
select setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));

insert into public.stations (id, slug, title, title_ne, tagline, tagline_ne, description, description_ne, cover_image, theme_color, ambient_type, is_featured, is_active, display_order, created_at, updated_at) values
(1, 'purano-radio', 'Purano Radio', 'पुरानो रेडियो', 'Classic golden era melodies from Radio Nepal and vintage tapes.', 'रेडियो नेपाल र पुराना क्यासेट टेपको सुनौलो कालखण्डका कालजयी धुनहरू।', '', '', 'https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?auto=format&fit=crop&w=1200&q=80', '#C7A66A', 'vintage_crackle', true, true, 0, '2026-10-09T06:38:50.929844', '2026-10-11T07:58:55.539529'),
(2, 'chiya-pasal', 'Chiya Pasal', 'चिया पसल', 'Morning steaming milk tea, warm banter, and peaceful acoustic strumming.', 'बिहानीको बाफिलो दूध चियाको चुस्की, साथीभाइको कुराकानी र शान्त धुनहरू।', '', '', 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80', '#B96B4A', 'teashop_rain', true, true, 1, '2026-10-09T06:38:50.935778', '2026-10-11T07:58:55.544904'),
(3, 'bus-yatra', 'Bus Yatra', 'बस यात्रा', 'Prithvi highway, misty mountain bends, and rhythmic travel anthems.', 'पृथ्वी राजमार्ग, कुहिरीमण्डल डाँडाहरू र झ्यालबाट सुनिने लोकप्रिय यात्रा धुन।', '', '', 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80', '#425746', 'bus_highway', true, true, 2, '2026-10-09T06:38:50.940984', '2026-10-11T07:58:55.549456'),
(4, 'lok-dohori', 'Lok Dohori', 'लोक दोहोरी', 'Authentic conversational folklore, madal beats, and village heartbeats.', 'मादलको घन्काइ, गाउँले मौलिकता र जनजीवन झल्काउने मीठा लोक भाकाहरू।', '', '', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80', '#C7A66A', 'village_birds', true, true, 3, '2026-10-09T06:38:50.944822', '2026-10-11T07:58:55.553751'),
(5, 'prem-geet', 'Prem Geet', 'प्रेम गीत', 'Romantic expressions across generations, sweet devotion, and gentle poetry.', 'मुटु छुने प्रेमिल अभिव्यक्ति, काव्यिक शब्द र अजर-अमर रोमान्टिक धुनहरू।', '', '', 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80', '#D97706', 'gentle_breeze', true, true, 4, '2026-10-09T06:38:50.947827', '2026-10-11T07:58:55.559406'),
(6, 'biraha', 'Biraha', 'विरह', 'Soul-stirring melancholic reflections, poignant nostalgia, and rain-soaked nights.', 'गहिरो विरह, आँखा रसाउने यादहरू र एकान्त रातका कारुणिक स्वरहरू।', '', '', 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80', '#4B5563', 'rainy_night', true, true, 5, '2026-10-09T06:38:50.951182', '2026-10-11T07:58:55.564237'),
(7, 'nepali-rock', 'Nepali Rock', 'नेपाली रक', 'Electric riffs intertwined with traditional flute, rebellious spirits, and iconic anthems.', 'बाँसुरी र गिटारको अनुपम संगम, नयाँ युगको ऊर्जा र रक क्रान्तिका धुन।', '', '', 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80', '#991B1B', 'tape_hiss', true, true, 6, '2026-10-09T06:38:50.954004', '2026-10-11T07:58:55.567611'),
(8, 'naya-dhun', 'Naya Dhun', 'नयाँ धुन', 'Contemporary Nepali indie, modern storytelling, and evolving acoustic sounds.', 'समकालीन नेपाली संगीत, नयाँ पुस्ताको आवाज र मिठासपूर्ण रचनाहरू।', '', '', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80', '#059669', 'coffee_shop', true, true, 7, '2026-10-09T06:38:50.957426', '2026-10-11T07:58:55.571091'),
(9, 'dashain-tihar', 'Dashain Tihar', 'दशैं तिहार', 'Malshree melody in the autumn sky, flying kites, swinging pings, and festive euphoria.', 'शरद ऋतुको नीलो आकाश, मालश्रीको मधुर धुन, पिङ, चङ्गा र देउसी-भैलोको उल्लास।', '', '', 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?auto=format&fit=crop&w=1200&q=80', '#EA580C', 'temple_bells', true, true, 8, '2026-10-09T06:38:50.960361', '2026-10-11T07:58:55.575527'),
(10, 'himalayan-acoustic', 'Himalayan Acoustic', 'हिमालयन एकौस्टिक', 'Tranquil bamboo flutes, mountain breezes, peaceful sarangi, and inner calm.', 'हिमालको काख, शान्त बाँसुरी, सारङ्गी र मन शान्त पार्ने प्राकृतिक ध्वनिका धुन।', '', '', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80', '#0D9488', 'mountain_wind', true, true, 9, '2026-10-09T06:38:50.965229', '2026-10-11T07:58:55.578879');
select setval(pg_get_serial_sequence('public.stations', 'id'), (select max(id) from public.stations));

insert into public.station_songs (station_id, song_id, position) values
(1, 1, 0),
(1, 3, 1),
(1, 16, 2),
(1, 4, 3),
(1, 5, 4),
(1, 97, 5),
(1, 98, 6),
(1, 112, 7),
(1, 109, 8),
(1, 114, 9),
(1, 113, 10),
(1, 115, 11),
(1, 116, 12),
(2, 8, 0),
(2, 10, 1),
(2, 108, 2),
(2, 105, 3),
(2, 3, 4),
(2, 1, 5),
(2, 107, 6),
(2, 104, 7),
(2, 137, 8),
(2, 123, 9),
(2, 121, 10),
(2, 117, 11),
(3, 6, 0),
(3, 7, 1),
(3, 11, 2),
(3, 2, 3),
(3, 99, 4),
(3, 100, 5),
(3, 106, 6),
(3, 108, 7),
(3, 120, 8),
(3, 122, 9),
(4, 12, 0),
(4, 2, 1),
(4, 101, 3),
(4, 103, 4),
(4, 110, 5),
(4, 127, 6),
(4, 128, 7),
(4, 129, 8),
(4, 130, 9),
(4, 131, 10),
(4, 132, 11),
(4, 133, 12),
(4, 134, 13),
(4, 135, 14),
(4, 136, 15),
(5, 1, 0),
(5, 10, 1),
(5, 16, 2),
(5, 15, 3),
(5, 98, 4),
(5, 112, 5),
(5, 105, 6),
(5, 113, 7),
(5, 121, 8),
(5, 122, 9),
(5, 117, 10),
(5, 116, 11),
(6, 4, 0),
(6, 5, 1),
(6, 15, 2),
(6, 102, 3),
(6, 109, 4),
(6, 128, 5),
(6, 135, 6),
(6, 130, 7),
(7, 6, 0),
(7, 7, 1),
(7, 9, 2),
(7, 11, 3),
(7, 99, 4),
(7, 106, 5),
(7, 120, 6),
(7, 118, 7),
(8, 10, 0),
(8, 8, 1),
(8, 11, 2),
(8, 100, 3),
(8, 108, 4),
(8, 105, 5),
(8, 118, 6),
(8, 119, 7),
(8, 141, 8),
(8, 142, 9),
(8, 134, 10),
(9, 12, 0),
(9, 103, 1),
(9, 110, 2),
(9, 101, 3),
(9, 139, 4),
(9, 138, 5),
(9, 136, 6),
(9, 133, 7),
(10, 8, 0),
(10, 111, 1),
(10, 104, 2),
(10, 105, 3),
(10, 123, 4),
(10, 125, 5),
(10, 126, 6),
(10, 124, 7);

-- ---------------------------------------------------------------------------
-- Festival song links + festive catalog songs (taxonomy lives in
-- 0007_festival_features.sql). These live in the seed (not the migration)
-- because they reference seeded artist/song ids and the festive songs should
-- only exist once the catalog does. Safe to re-run only on an empty database.
-- ---------------------------------------------------------------------------
-- Link festival-adjacent catalog songs to their festival.
update public.songs
set festival_id = c.id
from (values
    (13, 1),   -- Malshree Dhun (Dashain) -> Dashain
    (12, 3),   -- Chari Jailaima -> Teej
    (139, 2)   -- Jai Mata Laxmi -> Tihar
) as mapping(song_id, festival_id)
join public.festival_categories c on c.id = mapping.festival_id
where public.songs.id = mapping.song_id;

-- Festive catalog songs. Real, embeddable YouTube uploads tagged to their
-- festival (taxonomy lives in 0007_festival_features.sql). These live in the
-- seed (not the migration) because they reference seeded artist ids and should
-- only exist once the catalog does. Safe to re-run only on an empty database.
insert into public.songs (
    id, title, title_ne, romanized_title, artist_id, featured_artists, composer, lyricist, album,
    film_or_source, release_year, language, primary_genre_id, mood_tags, decade,
    duration_seconds, artwork_url, playback_provider, provider_video_id, provider_url, source_url,
    attribution, metadata_verification_status, publication_status, play_count, is_featured, featured_order,
    created_at, updated_at
) values
    (1001, 'Malshree Dhun', 'मालश्री धुन', 'Malshree Dhun', 11, '', 'Traditional', 'Traditional', '', '', 2023, 'Nepali', 10, '["festive","dashain","malshree","traditional"]'::jsonb, '2020s', 300, 'https://img.youtube.com/vi/SZBXLToQIYQ/hqdefault.jpg', 'youtube', 'SZBXLToQIYQ', 'https://www.youtube.com/watch?v=SZBXLToQIYQ', 'https://www.youtube.com/watch?v=SZBXLToQIYQ', 'Real Star Nepal', 'verified', 'published', 15000, true, 1, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1002, 'Dashain Hoki Dasa Ho', 'दशैं होकि दश हो', 'Dashain Hoki Dasa Ho', 28, '', 'Dekendra Shrestha', 'Dekendra Shrestha', '', '', 2023, 'Nepali', 10, '["festive","dashain","emotional","heart-touching"]'::jsonb, '2020s', 240, 'https://img.youtube.com/vi/T7MkGVBAP8w/hqdefault.jpg', 'youtube', 'T7MkGVBAP8w', 'https://www.youtube.com/watch?v=T7MkGVBAP8w', 'https://www.youtube.com/watch?v=T7MkGVBAP8w', 'Dekendra Shrestha', 'verified', 'published', 14500, true, 2, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1003, 'Deusi Bhailo', 'देउसी भैलो', 'Deusi Bhailo', 30, '', 'Shambhu Rai', 'Traditional', '', '', 2020, 'Nepali', 10, '["festive","tihar","deusi","bhailo"]'::jsonb, '2020s', 210, 'https://img.youtube.com/vi/anpLTq3Jw2Q/hqdefault.jpg', 'youtube', 'anpLTq3Jw2Q', 'https://www.youtube.com/watch?v=anpLTq3Jw2Q', 'https://www.youtube.com/watch?v=anpLTq3Jw2Q', 'Music Nepal', 'verified', 'published', 13000, true, 1, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1004, 'Deusi Bhailo (2081)', 'देउसी भैलो (२०८१)', 'Deusi Bhailo 2081', 29, '', 'Bal Kumar Shrestha', 'Babina Rai', '', '', 2024, 'Nepali', 10, '["festive","tihar","deusi","bhailo"]'::jsonb, '2020s', 205, 'https://img.youtube.com/vi/iyhUxdcBTmE/hqdefault.jpg', 'youtube', 'iyhUxdcBTmE', 'https://www.youtube.com/watch?v=iyhUxdcBTmE', 'https://www.youtube.com/watch?v=iyhUxdcBTmE', 'Music Star Nepal', 'verified', 'published', 12800, true, 2, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1005, 'Tihar Dhun, Bhailo', 'तिहार धून, भैलो', 'Tihar Dhun Bhailo', 11, '', 'Traditional', 'Traditional', '', '', 2021, 'Nepali', 10, '["festive","tihar","dhun","laxmi-puja"]'::jsonb, '2020s', 300, 'https://img.youtube.com/vi/qwtUJOKOFfE/hqdefault.jpg', 'youtube', 'qwtUJOKOFfE', 'https://www.youtube.com/watch?v=qwtUJOKOFfE', 'https://www.youtube.com/watch?v=qwtUJOKOFfE', 'Bhakti Nepali Bhajan', 'verified', 'published', 10500, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1006, 'Teej Ko Koseli', 'तीजको कोसेली', 'Teej Ko Koseli', 8, '', 'Traditional', 'Traditional', '', '', 2026, 'Nepali', 10, '["festive","teej","folk","women"]'::jsonb, '2020s', 230, 'https://img.youtube.com/vi/Cr0WwJNBcus/hqdefault.jpg', 'youtube', 'Cr0WwJNBcus', 'https://www.youtube.com/watch?v=Cr0WwJNBcus', 'https://www.youtube.com/watch?v=Cr0WwJNBcus', 'Jukebox Nepal', 'verified', 'published', 12000, true, 1, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1007, 'Gharbar', 'घरबार', 'Gharbar', 8, '', 'Traditional', 'Traditional', '', '', 2026, 'Nepali', 10, '["festive","teej","longing","emotional"]'::jsonb, '2020s', 240, 'https://img.youtube.com/vi/dJvukg91VYA/hqdefault.jpg', 'youtube', 'dJvukg91VYA', 'https://www.youtube.com/watch?v=dJvukg91VYA', 'https://www.youtube.com/watch?v=dJvukg91VYA', 'Sapana Music Industries', 'verified', 'published', 11800, true, 2, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1008, 'Aaina Aama Yo Teejma', 'आईन आमा यो तीजमा', 'Aaina Aama Yo Teejma', 8, '', 'Traditional', 'Traditional', '', '', 2024, 'Nepali', 10, '["festive","teej","maita","emotional"]'::jsonb, '2020s', 235, 'https://img.youtube.com/vi/TQ0ElQ2TkmQ/hqdefault.jpg', 'youtube', 'TQ0ElQ2TkmQ', 'https://www.youtube.com/watch?v=TQ0ElQ2TkmQ', 'https://www.youtube.com/watch?v=TQ0ElQ2TkmQ', 'Sapana Music Industries', 'verified', 'published', 11600, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1009, 'Ma Maita Aaina', 'म माइता आइना', 'Ma Maita Aaina', 31, '', 'Sachitra Gharti', 'Sachitra Gharti', '', '', 2026, 'Nepali', 10, '["festive","teej","maita","emotional"]'::jsonb, '2020s', 225, 'https://img.youtube.com/vi/0Iwt5lofdxQ/hqdefault.jpg', 'youtube', '0Iwt5lofdxQ', 'https://www.youtube.com/watch?v=0Iwt5lofdxQ', 'https://www.youtube.com/watch?v=0Iwt5lofdxQ', 'KDP Digital Creation', 'verified', 'published', 10000, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1010, 'Naya Barsha Aayo', 'नयाँ वर्ष आयो', 'Naya Barsha Aayo', 32, '', 'Krishna Sapkota', 'Krishna Sapkota', '', '', 2026, 'Nepali', 10, '["festive","newyear","chitrabhan","hope"]'::jsonb, '2020s', 200, 'https://img.youtube.com/vi/ccOU4Tyz7FU/hqdefault.jpg', 'youtube', 'ccOU4Tyz7FU', 'https://www.youtube.com/watch?v=ccOU4Tyz7FU', 'https://www.youtube.com/watch?v=ccOU4Tyz7FU', 'Krishna Sapkota', 'verified', 'published', 9000, true, 1, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1011, 'Naya Barsa Subhakamana', 'नयाँ वर्ष शुभकामना', 'Naya Barsa Subhakamana', 33, '', 'Anil Gurdhami', 'Anil Gurdhami', '', '', 2025, 'Nepali', 10, '["festive","newyear","chitrabhan","greeting"]'::jsonb, '2020s', 195, 'https://img.youtube.com/vi/OoNAEeFza4Q/hqdefault.jpg', 'youtube', 'OoNAEeFza4Q', 'https://www.youtube.com/watch?v=OoNAEeFza4Q', 'https://www.youtube.com/watch?v=OoNAEeFza4Q', 'Anil Gurdhami', 'verified', 'published', 8500, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1012, 'Sonam Lhosar La, Tashi Delek', 'सोनम ल्होसार, ताशी देलेक', 'Sonam Lhosar La Tashi Delek', 16, '', 'Traditional', 'Traditional', '', '', 2023, 'Nepali', 10, '["festive","sonam-lhosar","tamang","selo"]'::jsonb, '2020s', 210, 'https://img.youtube.com/vi/9qpFJMup9E0/hqdefault.jpg', 'youtube', '9qpFJMup9E0', 'https://www.youtube.com/watch?v=9qpFJMup9E0', 'https://www.youtube.com/watch?v=9qpFJMup9E0', 'T.K. Series', 'verified', 'published', 7000, true, 1, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1013, 'Sonam Lhochhar Song', 'सोनाम ल्होछार गीत', 'Sonam Lhochhar Song', 34, '', 'SB Ghising', 'SB Ghising', '', '', 2025, 'Nepali', 10, '["festive","sonam-lhosar","tamang","newyear"]'::jsonb, '2020s', 220, 'https://img.youtube.com/vi/IycyJCoAGY8/hqdefault.jpg', 'youtube', 'IycyJCoAGY8', 'https://www.youtube.com/watch?v=IycyJCoAGY8', 'https://www.youtube.com/watch?v=IycyJCoAGY8', 'SB Ghising', 'verified', 'published', 6800, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1014, 'Lord Buddha Jayanti', 'भगवान बुद्ध जयंती', 'Lord Buddha Jayanti', 21, '', 'Traditional', 'Traditional', '', '', 2021, 'Nepali', 10, '["festive","buddha-jayanti","peaceful","devotional"]'::jsonb, '2020s', 260, 'https://img.youtube.com/vi/b5YaK8ONll4/hqdefault.jpg', 'youtube', 'b5YaK8ONll4', 'https://www.youtube.com/watch?v=b5YaK8ONll4', 'https://www.youtube.com/watch?v=b5YaK8ONll4', 'Nepal Life Motivation', 'verified', 'published', 6000, true, 1, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1015, 'Buddha Jayanti Message of Peace', 'बुद्ध जयन्ती शान्तिको सन्देश', 'Buddha Jayanti Message of Peace', 21, '', 'Nephoria Music', 'Nephoria Music', '', '', 2025, 'Nepali', 10, '["festive","buddha-jayanti","peace","devotional"]'::jsonb, '2020s', 250, 'https://img.youtube.com/vi/pC7x9VNYjwg/hqdefault.jpg', 'youtube', 'pC7x9VNYjwg', 'https://www.youtube.com/watch?v=pC7x9VNYjwg', 'https://www.youtube.com/watch?v=pC7x9VNYjwg', 'Nephoria Music', 'verified', 'published', 5800, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1016, 'Shivaratri Special Nepali Bhajan', 'शिवरात्रि विशेष भजन', 'Shivaratri Special Nepali Bhajan', 21, '', 'Traditional', 'Traditional', '', '', 2024, 'Nepali', 10, '["festive","maha-shivaratri","bhajan","devotional"]'::jsonb, '2020s', 300, 'https://img.youtube.com/vi/HsdXczS2pa8/hqdefault.jpg', 'youtube', 'HsdXczS2pa8', 'https://www.youtube.com/watch?v=HsdXczS2pa8', 'https://www.youtube.com/watch?v=HsdXczS2pa8', 'SRD Bhakti', 'verified', 'published', 5200, true, 1, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1017, 'Shivaratri Nepali Bhajan 2082', 'महाशिवरात्रि भजन २०८२', 'Shivaratri Nepali Bhajan 2082', 21, '', 'Traditional', 'Traditional', '', '', 2026, 'Nepali', 10, '["festive","maha-shivaratri","bhajan","bholenath"]'::jsonb, '2020s', 290, 'https://img.youtube.com/vi/059FsrfuGos/hqdefault.jpg', 'youtube', '059FsrfuGos', 'https://www.youtube.com/watch?v=059FsrfuGos', 'https://www.youtube.com/watch?v=059FsrfuGos', 'Mero Dhun Entertainment', 'verified', 'published', 5000, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z');
select setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));

-- Heart-touching festive dhuns (ids 1018-1029): reunion, a mother's love,
-- childhood nostalgia, sibling bonds and devotional longing. Each carries a
-- real, embeddable video chosen to match its theme.
insert into public.songs (
    id, title, title_ne, romanized_title, artist_id, featured_artists, composer, lyricist, album,
    film_or_source, release_year, language, primary_genre_id, mood_tags, decade,
    duration_seconds, artwork_url, playback_provider, provider_video_id, provider_url, source_url,
    attribution, metadata_verification_status, publication_status, play_count, is_featured, featured_order,
    created_at, updated_at
) values
    (1018, 'Ghar Aaun Dashain Ma', 'घर आउँ दशैंमा', 'Ghar Aaun Dashain Ma', 11, '', 'Traditional', 'Traditional', '', '', 1998, 'Nepali', 10, '["festive","dashain","reunion","emotional"]'::jsonb, '1990s', 250, 'https://img.youtube.com/vi/P5XIvU24jXI/hqdefault.jpg', 'youtube', 'P5XIvU24jXI', 'https://www.youtube.com/watch?v=P5XIvU24jXI', 'https://www.youtube.com/watch?v=P5XIvU24jXI', 'Agni Music', 'verified', 'published', 14000, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1019, 'Aama Ko Maya', 'आमाको माया', 'Aama Ko Maya', 11, '', 'Traditional', 'Traditional', '', '', 1995, 'Nepali', 10, '["festive","dashain","mother","emotional"]'::jsonb, '1990s', 260, 'https://img.youtube.com/vi/sipYYphvX6Y/hqdefault.jpg', 'youtube', 'sipYYphvX6Y', 'https://www.youtube.com/watch?v=sipYYphvX6Y', 'https://www.youtube.com/watch?v=sipYYphvX6Y', 'Himal Tune Official', 'verified', 'published', 13500, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1020, 'Pingale Chadeko Din', 'पिङले चढेको दिन', 'Pingale Chadeko Din', 11, '', 'Traditional', 'Traditional', '', '', 2001, 'Nepali', 10, '["festive","dashain","childhood","nostalgia"]'::jsonb, '2000s', 220, 'https://img.youtube.com/vi/ivhmeC1CSFg/hqdefault.jpg', 'youtube', 'ivhmeC1CSFg', 'https://www.youtube.com/watch?v=ivhmeC1CSFg', 'https://www.youtube.com/watch?v=ivhmeC1CSFg', 'Peak Studio Beats', 'verified', 'published', 11000, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1021, 'Didi Bhai Ko Maya', 'दिदी भाइको माया', 'Didi Bhai Ko Maya', 11, '', 'Traditional', 'Traditional', '', '', 2000, 'Nepali', 10, '["festive","tihar","siblings","emotional"]'::jsonb, '2000s', 240, 'https://img.youtube.com/vi/zBM2yCpRsZ0/hqdefault.jpg', 'youtube', 'zBM2yCpRsZ0', 'https://www.youtube.com/watch?v=zBM2yCpRsZ0', 'https://www.youtube.com/watch?v=zBM2yCpRsZ0', 'Music Nepal', 'verified', 'published', 12500, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1022, 'Deusi Khelna Aayen', 'देउसी खेल्न आएँ', 'Deusi Khelna Aayen', 11, '', 'Traditional', 'Traditional', '', '', 2003, 'Nepali', 10, '["festive","tihar","deusi","community"]'::jsonb, '2000s', 190, 'https://img.youtube.com/vi/SI0MQzESyFY/hqdefault.jpg', 'youtube', 'SI0MQzESyFY', 'https://www.youtube.com/watch?v=SI0MQzESyFY', 'https://www.youtube.com/watch?v=SI0MQzESyFY', 'Asian Music Nepal', 'verified', 'published', 8900, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1023, 'Ghar Aangan Diyo', 'घर आँगन दियो', 'Ghar Aangan Diyo', 11, '', 'Traditional', 'Traditional', '', '', 2010, 'Nepali', 10, '["festive","tihar","diwali","lights"]'::jsonb, '2010s', 210, 'https://img.youtube.com/vi/OTzufR6-sZY/hqdefault.jpg', 'youtube', 'OTzufR6-sZY', 'https://www.youtube.com/watch?v=OTzufR6-sZY', 'https://www.youtube.com/watch?v=OTzufR6-sZY', 'Music Nepal', 'verified', 'published', 7600, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1024, 'Maita Ko Yaad', 'माइतको याद', 'Maita Ko Yaad', 8, '', 'Traditional', 'Traditional', '', '', 2007, 'Nepali', 10, '["festive","teej","longing","emotional"]'::jsonb, '2000s', 230, 'https://img.youtube.com/vi/X3--bTb1gnQ/hqdefault.jpg', 'youtube', 'X3--bTb1gnQ', 'https://www.youtube.com/watch?v=X3--bTb1gnQ', 'https://www.youtube.com/watch?v=X3--bTb1gnQ', 'Nepalmusic Rock', 'verified', 'published', 10200, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1025, 'Rato Sari Teej', 'रातो सारी तीज', 'Rato Sari Teej', 8, '', 'Traditional', 'Traditional', '', '', 2013, 'Nepali', 10, '["festive","teej","women","dance"]'::jsonb, '2010s', 200, 'https://img.youtube.com/vi/Lqk5KjvMyTU/hqdefault.jpg', 'youtube', 'Lqk5KjvMyTU', 'https://www.youtube.com/watch?v=Lqk5KjvMyTU', 'https://www.youtube.com/watch?v=Lqk5KjvMyTU', 'Aashir Pratap Jung', 'verified', 'published', 8100, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1026, 'Naya Barsa Ko Sanket', 'नयाँ वर्षको सङ्केत', 'Naya Barsa Ko Sanket', 11, '', 'Traditional', 'Traditional', '', '', 2016, 'Nepali', 10, '["festive","chitrabhan","newyear","hope"]'::jsonb, '2010s', 185, 'https://img.youtube.com/vi/me_6BAB_PAo/hqdefault.jpg', 'youtube', 'me_6BAB_PAo', 'https://www.youtube.com/watch?v=me_6BAB_PAo', 'https://www.youtube.com/watch?v=me_6BAB_PAo', 'Saptarangi Sansar', 'verified', 'published', 5400, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1027, 'Lhosar Ko Ujyalo', 'ल्होसारको उज्यालो', 'Lhosar Ko Ujyalo', 16, '', 'Traditional', 'Traditional', '', '', 2016, 'Nepali', 10, '["festive","sonam-lhosar","tamang","newyear"]'::jsonb, '2010s', 195, 'https://img.youtube.com/vi/jToxBewxKLA/hqdefault.jpg', 'youtube', 'jToxBewxKLA', 'https://www.youtube.com/watch?v=jToxBewxKLA', 'https://www.youtube.com/watch?v=jToxBewxKLA', 'Prakash Tamang Titung', 'verified', 'published', 4800, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1028, 'Buddha Ko Maya', 'बुद्धको माया', 'Buddha Ko Maya', 21, '', 'Traditional', 'Traditional', '', '', 2019, 'Nepali', 10, '["festive","buddha-jayanti","peaceful","devotional"]'::jsonb, '2010s', 250, 'https://img.youtube.com/vi/0YUlMVUYwvM/hqdefault.jpg', 'youtube', '0YUlMVUYwvM', 'https://www.youtube.com/watch?v=0YUlMVUYwvM', 'https://www.youtube.com/watch?v=0YUlMVUYwvM', 'Motivara Lotus', 'verified', 'published', 4300, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z'),
    (1029, 'Bhole Baba Bhajan', 'भोले बाबा भजन', 'Bhole Baba Bhajan', 21, '', 'Traditional', 'Traditional', '', '', 2014, 'Nepali', 10, '["festive","maha-shivaratri","bhajan","devotional"]'::jsonb, '2010s', 270, 'https://img.youtube.com/vi/8SFZL0yg6oA/hqdefault.jpg', 'youtube', '8SFZL0yg6oA', 'https://www.youtube.com/watch?v=8SFZL0yg6oA', 'https://www.youtube.com/watch?v=8SFZL0yg6oA', 'Pradip Tiwari', 'verified', 'published', 3900, false, 0, '2026-10-17T08:00:00.000Z', '2026-10-17T08:00:00.000Z');
select setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));

-- Calendar-era festive additions (ids 1030-1061): dedicated songs for the
-- other major Nepali festivals (Chhath, Maghe Sankranti, Holi, Ram Navami,
-- Janai Purnima, Krishna Janmashtami, Gaura, the Jatras, the Losars, Yomari
-- Punhi, Christmas, Eid, Udhauli/Ubhauli). Every provider_video_id is a real,
-- embeddable YouTube upload.
insert into public.songs (
    id, title, title_ne, romanized_title, artist_id, featured_artists, composer, lyricist, album,
    film_or_source, release_year, language, primary_genre_id, mood_tags, decade,
    duration_seconds, artwork_url, playback_provider, provider_video_id, provider_url, source_url,
    attribution, metadata_verification_status, publication_status, play_count, is_featured, featured_order,
    created_at, updated_at
) values
    (1030, 'Hey Bhaskar Hey Prabhakar', 'हे भास्कर हे प्रभाकर', 'Hey Bhaskar Hey Prabhakar', 35, '', 'Traditional', 'Traditional', '', '', 2023, 'Nepali', 13, '["festive","chhath","devotional","sun"]'::jsonb, '2020s', 260, 'https://img.youtube.com/vi/5L--rtz21uo/hqdefault.jpg', 'youtube', '5L--rtz21uo', 'https://www.youtube.com/watch?v=5L--rtz21uo', 'https://www.youtube.com/watch?v=5L--rtz21uo', 'MN Bhajan', 'verified', 'published', 4200, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1031, 'Dukhwa Mitayin Chhathi Maiya', 'दुःखवा मिटयिन छठी मैया', 'Dukhwa Mitayin Chhathi Maiya', 36, '', 'Traditional', 'Traditional', '', '', 2024, 'Hindi', 10, '["festive","chhath","devotional"]'::jsonb, '2020s', 300, 'https://img.youtube.com/vi/NkDiSj9c1EA/hqdefault.jpg', 'youtube', 'NkDiSj9c1EA', 'https://www.youtube.com/watch?v=NkDiSj9c1EA', 'https://www.youtube.com/watch?v=NkDiSj9c1EA', 'Sharda Sinha Official', 'verified', 'published', 9800, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1032, 'Happy Maghi Sankranti', 'शुभ माघी संक्रान्ति', 'Happy Maghi Sankranti', 37, 'Anjana Saru Magar', 'Traditional', 'Traditional', '', '', 2024, 'Nepali', 3, '["festive","maghe","magar","dance"]'::jsonb, '2020s', 240, 'https://img.youtube.com/vi/kGI2ogvDgsU/hqdefault.jpg', 'youtube', 'kGI2ogvDgsU', 'https://www.youtube.com/watch?v=kGI2ogvDgsU', 'https://www.youtube.com/watch?v=kGI2ogvDgsU', 'TNF Officials', 'verified', 'published', 3600, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1033, 'Maghe Sankranti Bhajan', 'माघे संक्रान्ति भजन', 'Maghe Sankranti Bhajan', 38, '', 'Ratan Bharadwaj', 'Ratan Bharadwaj', '', '', 2024, 'Nepali', 13, '["festive","maghe","bhajan","devotional"]'::jsonb, '2020s', 280, 'https://img.youtube.com/vi/hgNAGgke2XI/hqdefault.jpg', 'youtube', 'hgNAGgke2XI', 'https://www.youtube.com/watch?v=hgNAGgke2XI', 'https://www.youtube.com/watch?v=hgNAGgke2XI', 'Ratan Bharadwaj Official', 'verified', 'published', 3100, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1034, 'Happy Holi', 'ह्याप्पी होली', 'Happy Holi', 39, 'Laxmi Malla', 'Durgesh Thapa', 'Durgesh Thapa', '', '', 2020, 'Nepali', 10, '["festive","holi","dance","folk"]'::jsonb, '2020s', 220, 'https://img.youtube.com/vi/aDMnIaQA8Zk/hqdefault.jpg', 'youtube', 'aDMnIaQA8Zk', 'https://www.youtube.com/watch?v=aDMnIaQA8Zk', 'https://www.youtube.com/watch?v=aDMnIaQA8Zk', 'Durgesh Thapa Official', 'verified', 'published', 5200, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1035, 'Fagu Punhiya Holi', 'फागुं पुन्हिया होली', 'Fagu Punhiya Holi', 40, '', 'Traditional', 'Traditional', '', '', 2022, 'Nepali', 10, '["festive","holi","newari","folk"]'::jsonb, '2020s', 240, 'https://img.youtube.com/vi/YjYMWtlZevE/hqdefault.jpg', 'youtube', 'YjYMWtlZevE', 'https://www.youtube.com/watch?v=YjYMWtlZevE', 'https://www.youtube.com/watch?v=YjYMWtlZevE', 'Music Nepal', 'verified', 'published', 4400, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1036, 'Ram Kai Katha Sunaun', 'रामकै कथा सुनौं', 'Ram Kai Katha Sunaun', 41, 'Prakash Parajuli', 'Pradip Tiwari', 'Traditional', '', '', 2025, 'Nepali', 13, '["ram-navami","ram","bhajan","devotional"]'::jsonb, '2020s', 300, 'https://img.youtube.com/vi/AaeszvPqXHs/hqdefault.jpg', 'youtube', 'AaeszvPqXHs', 'https://www.youtube.com/watch?v=AaeszvPqXHs', 'https://www.youtube.com/watch?v=AaeszvPqXHs', 'Pradip Tiwari', 'verified', 'published', 2900, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1037, 'Ram Kai Bhajan Ram Kai Kirtan', 'रामकै भजन रामकै कीर्तन', 'Ram Kai Bhajan Ram Kai Kirtan', 42, '', 'Nabin Baral', 'Traditional', '', '', 2024, 'Nepali', 13, '["ram-navami","ram","bhajan","devotional"]'::jsonb, '2020s', 280, 'https://img.youtube.com/vi/C7oAQV4f0a0/hqdefault.jpg', 'youtube', 'C7oAQV4f0a0', 'https://www.youtube.com/watch?v=C7oAQV4f0a0', 'https://www.youtube.com/watch?v=C7oAQV4f0a0', 'Nabin Baral', 'verified', 'published', 2600, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1038, 'Kada Jhyaure Git Kumbheswor', 'कडा झ्याउरे गीत कुम्भेश्वर', 'Kada Jhyaure Git Kumbheswor', 43, '', 'Karma Bahadur Karki', 'Traditional', '', '', 2024, 'Nepali', 3, '["festive","janai-purnima","jhyaure","folk"]'::jsonb, '2020s', 210, 'https://img.youtube.com/vi/L_PiJqqNZ5Y/hqdefault.jpg', 'youtube', 'L_PiJqqNZ5Y', 'https://www.youtube.com/watch?v=L_PiJqqNZ5Y', 'https://www.youtube.com/watch?v=L_PiJqqNZ5Y', 'Karma Bahadur Karki', 'verified', 'published', 1800, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1039, 'Gunhu Punhi (Janai Purnima)', 'गुन्हु पुन्हि (जनै पूर्णिमा)', 'Gunhu Punhi Janai Purnima', 11, '', 'Traditional', 'Traditional', '', '', 2023, 'Newari', 12, '["festive","janai-purnima","newari","traditional"]'::jsonb, '2020s', 200, 'https://img.youtube.com/vi/D6GmRvZ5CTo/hqdefault.jpg', 'youtube', 'D6GmRvZ5CTo', 'https://www.youtube.com/watch?v=D6GmRvZ5CTo', 'https://www.youtube.com/watch?v=D6GmRvZ5CTo', 'Lumiora', 'verified', 'published', 1600, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1040, 'Bansuri Ko Dhun Mitho', 'बाँसुरीको धुन मीठो', 'Bansuri Ko Dhun Mitho', 44, '', 'Ashok Pandey', 'Traditional', '', '', 2023, 'Nepali', 13, '["krishna-janmashtami","krishna","bhajan","devotional"]'::jsonb, '2020s', 260, 'https://img.youtube.com/vi/oofKB5ayrDA/hqdefault.jpg', 'youtube', 'oofKB5ayrDA', 'https://www.youtube.com/watch?v=oofKB5ayrDA', 'https://www.youtube.com/watch?v=oofKB5ayrDA', 'Ashok Pandey Bhajan', 'verified', 'published', 3400, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1041, 'Ramaila Krishna Bhajan', 'रमाईला कृष्ण भजन', 'Ramaila Krishna Bhajan', 45, '', 'Sagar Khadka', 'Traditional', '', '', 2024, 'Nepali', 13, '["krishna-janmashtami","krishna","bhajan","devotional"]'::jsonb, '2020s', 300, 'https://img.youtube.com/vi/J3coeqDBInA/hqdefault.jpg', 'youtube', 'J3coeqDBInA', 'https://www.youtube.com/watch?v=J3coeqDBInA', 'https://www.youtube.com/watch?v=J3coeqDBInA', 'Sagar Khadka', 'verified', 'published', 2200, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1042, 'Gaura Parwa 2083', 'गौरा पर्व २०८३', 'Gaura Parwa 2083', 46, '', 'Shambhu Bhatt', 'Traditional', '', '', 2026, 'Nepali', 3, '["festive","gaura","deuda","folk"]'::jsonb, '2020s', 230, 'https://img.youtube.com/vi/s8ODWNRg4iM/hqdefault.jpg', 'youtube', 's8ODWNRg4iM', 'https://www.youtube.com/watch?v=s8ODWNRg4iM', 'https://www.youtube.com/watch?v=s8ODWNRg4iM', 'Shambhu Bhatt', 'verified', 'published', 1400, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1043, 'Thulo Deuda Khel', 'ठूलो देउडा खेल', 'Thulo Deuda Khel', 11, '', 'Traditional', 'Traditional', '', '', 2025, 'Nepali', 3, '["festive","gaura","deuda","folk"]'::jsonb, '2020s', 250, 'https://img.youtube.com/vi/GZ_UEg423CA/hqdefault.jpg', 'youtube', 'GZ_UEg423CA', 'https://www.youtube.com/watch?v=GZ_UEg423CA', 'https://www.youtube.com/watch?v=GZ_UEg423CA', 'SB7 Official', 'verified', 'published', 1200, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1044, 'Gaijatre Jhataro', 'गाईजात्रे झटारो', 'Gaijatre Jhataro', 47, 'Pradip Bishwokarma', 'Ulka Ghimire', 'Ulka Ghimire', '', '', 2026, 'Nepali', 3, '["festive","gai-jatra","jatra","folk"]'::jsonb, '2020s', 220, 'https://img.youtube.com/vi/-j3sjzc9E0E/hqdefault.jpg', 'youtube', '-j3sjzc9E0E', 'https://www.youtube.com/watch?v=-j3sjzc9E0E', 'https://www.youtube.com/watch?v=-j3sjzc9E0E', 'Nepali World', 'verified', 'published', 2000, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1045, 'Gai Jatra', 'गाई जात्रा', 'Gai Jatra', 48, '', 'Kuma Sagar', 'Kuma Sagar', '', '', 2024, 'Newari', 12, '["festive","gai-jatra","newari","community"]'::jsonb, '2020s', 210, 'https://img.youtube.com/vi/8NzqiiUWBcs/hqdefault.jpg', 'youtube', '8NzqiiUWBcs', 'https://www.youtube.com/watch?v=8NzqiiUWBcs', 'https://www.youtube.com/watch?v=8NzqiiUWBcs', 'Jheegu Newa Sanskriti', 'verified', 'published', 1700, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1046, 'Yenya Jatra', 'यन्या जात्रा', 'Yenya Jatra', 11, '', 'Traditional', 'Traditional', '', '', 2023, 'Newari', 12, '["festive","indra-jatra","newari","jatra"]'::jsonb, '2020s', 240, 'https://img.youtube.com/vi/rgDW7oJ6vGk/hqdefault.jpg', 'youtube', 'rgDW7oJ6vGk', 'https://www.youtube.com/watch?v=rgDW7oJ6vGk', 'https://www.youtube.com/watch?v=rgDW7oJ6vGk', 'Lumanti Entertainment', 'verified', 'published', 1900, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1047, 'Pulu Kisi', 'पुलु किसी', 'Pulu Kisi', 11, '', 'Traditional', 'Traditional', '', '', 2022, 'Newari', 12, '["festive","indra-jatra","newari","jatra"]'::jsonb, '2020s', 200, 'https://img.youtube.com/vi/dR_oan11qGk/hqdefault.jpg', 'youtube', 'dR_oan11qGk', 'https://www.youtube.com/watch?v=dR_oan11qGk', 'https://www.youtube.com/watch?v=dR_oan11qGk', 'The Himalayan Connection', 'verified', 'published', 1500, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1048, 'Bisket Jatra Ko Geet', 'बिस्केट जात्राको गीत', 'Bisket Jatra Ko Geet', 49, '', 'Anil Deshemaru', 'Traditional', '', '', 2023, 'Newari', 12, '["festive","bisket-jatra","newari","newyear"]'::jsonb, '2020s', 220, 'https://img.youtube.com/vi/hKL6qj_KXMQ/hqdefault.jpg', 'youtube', 'hKL6qj_KXMQ', 'https://www.youtube.com/watch?v=hKL6qj_KXMQ', 'https://www.youtube.com/watch?v=hKL6qj_KXMQ', 'Anil Deshemaru', 'verified', 'published', 1300, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1049, 'Biska Jatra Song', 'बिस्का जात्रा गीत', 'Biska Jatra Song', 11, '', 'Traditional', 'Traditional', '', '', 2022, 'Newari', 12, '["festive","bisket-jatra","newari","traditional"]'::jsonb, '2020s', 240, 'https://img.youtube.com/vi/FiIzO64Q88s/hqdefault.jpg', 'youtube', 'FiIzO64Q88s', 'https://www.youtube.com/watch?v=FiIzO64Q88s', 'https://www.youtube.com/watch?v=FiIzO64Q88s', 'Sairam Pictures', 'verified', 'published', 1100, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1050, 'Aayo Lhosar', 'आयो ल्होसार', 'Aayo Lhosar', 50, 'Govind Gurung', 'Reema Gurung', 'Reema Gurung', '', '', 2024, 'Nepali', 11, '["festive","tamu-lhosar","tamang","newyear"]'::jsonb, '2020s', 210, 'https://img.youtube.com/vi/cCfm4YFpPTM/hqdefault.jpg', 'youtube', 'cCfm4YFpPTM', 'https://www.youtube.com/watch?v=cCfm4YFpPTM', 'https://www.youtube.com/watch?v=cCfm4YFpPTM', 'Rodhi Music', 'verified', 'published', 2400, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1051, 'Tamu Lhosar Performance', 'तमु ल्होसार प्रस्तुति', 'Tamu Lhosar Performance', 51, '', 'Deepak Gurung', 'Traditional', '', '', 2026, 'Nepali', 11, '["festive","tamu-lhosar","tamang","dance"]'::jsonb, '2020s', 230, 'https://img.youtube.com/vi/cT56NQOiSYk/hqdefault.jpg', 'youtube', 'cT56NQOiSYk', 'https://www.youtube.com/watch?v=cT56NQOiSYk', 'https://www.youtube.com/watch?v=cT56NQOiSYk', 'Gurung Reels', 'verified', 'published', 1300, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1052, 'Losar Tashidelek', 'ल्होसार ताशी देलेक', 'Losar Tashidelek', 52, 'Chhongba Sherpa', 'Palmu Sherpa', 'Palmu Sherpa', '', '', 2025, 'Nepali', 10, '["festive","gyalpo-lhosar","losar","buddhist"]'::jsonb, '2020s', 220, 'https://img.youtube.com/vi/WD1eA0xj_ug/hqdefault.jpg', 'youtube', 'WD1eA0xj_ug', 'https://www.youtube.com/watch?v=WD1eA0xj_ug', 'https://www.youtube.com/watch?v=WD1eA0xj_ug', 'Palmu Sherpa', 'verified', 'published', 2100, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1053, 'Gyalpo Losar', 'ग्याल्पो ल्होसार', 'Gyalpo Losar', 53, '', 'Thupte Lama', 'Traditional', '', '', 2021, 'Nepali', 10, '["festive","gyalpo-lhosar","losar","buddhist"]'::jsonb, '2020s', 240, 'https://img.youtube.com/vi/-tbEJgtohR0/hqdefault.jpg', 'youtube', '-tbEJgtohR0', 'https://www.youtube.com/watch?v=-tbEJgtohR0', 'https://www.youtube.com/watch?v=-tbEJgtohR0', 'Phende Dhachhang', 'verified', 'published', 1400, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1054, 'Yomari Chwaamu', 'योमरी च्वामु', 'Yomari Chwaamu', 54, 'Ratna Shova', 'Rajan Raj Shiwakoti', 'Rajan Raj Shiwakoti', '', '', 2024, 'Nepali', 12, '["festive","yomari-punhi","newari","harvest"]'::jsonb, '2020s', 230, 'https://img.youtube.com/vi/36vIy1aqxnA/hqdefault.jpg', 'youtube', '36vIy1aqxnA', 'https://www.youtube.com/watch?v=36vIy1aqxnA', 'https://www.youtube.com/watch?v=36vIy1aqxnA', 'Devithan Music', 'verified', 'published', 2600, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1055, 'Yomari Punhi Song', 'योमरी पुन्ही गीत', 'Yomari Punhi Song', 55, '', 'Niva Dangol', 'Niva Dangol', '', '', 2023, 'Newari', 12, '["festive","yomari-punhi","newari","harvest"]'::jsonb, '2020s', 210, 'https://img.youtube.com/vi/nFQ5tatKNJU/hqdefault.jpg', 'youtube', 'nFQ5tatKNJU', 'https://www.youtube.com/watch?v=nFQ5tatKNJU', 'https://www.youtube.com/watch?v=nFQ5tatKNJU', 'Niva Dangol', 'verified', 'published', 1500, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1056, 'Dehadhaaranle', 'देहधारणले', 'Dehadhaaranle', 56, '', 'Adrian Dewan', 'Adrian Dewan', '', '', 2025, 'Nepali', 13, '["festive","christmas","devotional","peaceful"]'::jsonb, '2020s', 260, 'https://img.youtube.com/vi/EvGC1NJIu8A/hqdefault.jpg', 'youtube', 'EvGC1NJIu8A', 'https://www.youtube.com/watch?v=EvGC1NJIu8A', 'https://www.youtube.com/watch?v=EvGC1NJIu8A', 'Adrian Dewan Official', 'verified', 'published', 1800, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1057, 'Ramaune Kaaran', 'रमाउने कारण', 'Ramaune Kaaran', 56, '', 'Adrian Dewan', 'Adrian Dewan', '', '', 2024, 'Nepali', 13, '["festive","christmas","devotional","peaceful"]'::jsonb, '2020s', 250, 'https://img.youtube.com/vi/PNfhzws95Yc/hqdefault.jpg', 'youtube', 'PNfhzws95Yc', 'https://www.youtube.com/watch?v=PNfhzws95Yc', 'https://www.youtube.com/watch?v=PNfhzws95Yc', 'Adrian Dewan Official', 'verified', 'published', 1600, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1058, 'Eid Mubarak', 'ईद मुबारक', 'Eid Mubarak', 57, '', 'Munaf Shah', 'Munaf Shah', '', '', 2025, 'Nepali', 10, '["festive","eid","celebration"]'::jsonb, '2020s', 200, 'https://img.youtube.com/vi/jShojt5E0yI/hqdefault.jpg', 'youtube', 'jShojt5E0yI', 'https://www.youtube.com/watch?v=jShojt5E0yI', 'https://www.youtube.com/watch?v=jShojt5E0yI', 'Munaf Shah Official', 'verified', 'published', 1500, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1059, 'Eid Mubarak Song', 'ईद मुबारक गीत', 'Eid Mubarak Song', 58, '', 'Jam Voice', 'Jam Voice', '', '', 2026, 'Nepali', 10, '["festive","eid","emotional"]'::jsonb, '2020s', 210, 'https://img.youtube.com/vi/yfYcS0YW9o8/hqdefault.jpg', 'youtube', 'yfYcS0YW9o8', 'https://www.youtube.com/watch?v=yfYcS0YW9o8', 'https://www.youtube.com/watch?v=yfYcS0YW9o8', 'Jam Voice Official', 'verified', 'published', 1100, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1060, 'Ubhauli (Sakela Song)', 'उभौली (सकेला गीत)', 'Ubhauli Sakela Song', 59, 'Sunil Rai', 'Melina Rai', 'Traditional', '', '', 2024, 'Nepali', 3, '["festive","udhauli-ubhauli","kirat","dance"]'::jsonb, '2020s', 230, 'https://img.youtube.com/vi/gQf1HFCXT_E/hqdefault.jpg', 'youtube', 'gQf1HFCXT_E', 'https://www.youtube.com/watch?v=gQf1HFCXT_E', 'https://www.youtube.com/watch?v=gQf1HFCXT_E', 'Semanta Walakpa Rai', 'verified', 'published', 2300, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000'),
    (1061, 'Shyadar Pidar (Ubhauli)', 'श्यादार पिदार (उभौली)', 'Shyadar Pidar Ubhauli', 11, '', 'Traditional', 'Traditional', '', '', 2024, 'Nepali', 3, '["festive","udhauli-ubhauli","kirat","folk"]'::jsonb, '2020s', 220, 'https://img.youtube.com/vi/HAEdKiL_aVA/hqdefault.jpg', 'youtube', 'HAEdKiL_aVA', 'https://www.youtube.com/watch?v=HAEdKiL_aVA', 'https://www.youtube.com/watch?v=HAEdKiL_aVA', 'Anushikha Vlogs', 'verified', 'published', 1200, false, 0, '2026-10-17T09:00:00.000000', '2026-10-17T09:00:00.000000');
select setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));


-- Most-viewed festive songs (ids 1062+): the biggest, most-played real
-- festival uploads per celebration, drawn from YouTube view counts and verified
-- embeddable. These surface in the "Trending" tier of the festive mix and are
-- tagged with the `most-viewed` / `popular` moods.
insert into public.artists (id, display_name, display_name_ne, biography, biography_ne, profile_image, verification_status, created_at, updated_at) values
    (60, 'Sugam Pokharel', '', 'Sugam Pokharel — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (61, 'Budha Subba Digital', '', 'Budha Subba Digital — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (62, 'Tanka Budathoki', '', 'Tanka Budathoki — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (63, 'Kripa Drishya Digital', '', 'Kripa Drishya Digital — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (64, 'Shanti Shree Pariyar', '', 'Shanti Shree Pariyar — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (65, 'Sindhu Malla', '', 'Sindhu Malla — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (66, 'Bishal Kaltan', '', 'Bishal Kaltan — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (67, 'Essence of Universe', '', 'Essence of Universe — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (68, 'Sonu Nigam', '', 'Sonu Nigam — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (69, 'Music Nepal', '', 'Music Nepal — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (70, 'Vishal Mishra', '', 'Vishal Mishra — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (71, 'Sidartha Ale Magar', '', 'Sidartha Ale Magar — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (72, 'Hamar Music Pahura', '', 'Hamar Music Pahura — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (73, 'Narayan Rayamajhi', '', 'Narayan Rayamajhi — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (74, 'Chakra Bam', '', 'Chakra Bam — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (75, 'Surya Khadka', '', 'Surya Khadka — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (76, 'Khuman Adhikari', '', 'Khuman Adhikari — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (77, 'Jubin Nautiyal', '', 'Jubin Nautiyal — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (78, 'Spiritual Mantra', '', 'Spiritual Mantra — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (79, 'OSR Digital', '', 'OSR Digital — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (80, 'Deepak Bajracharya', '', 'Deepak Bajracharya — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (81, 'Ujan Shakya', '', 'Ujan Shakya — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (82, 'Rajendra Shrestha', '', 'Rajendra Shrestha — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (83, 'Ghampani', '', 'Ghampani — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (84, 'Karma Tseten', '', 'Karma Tseten — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (85, 'Aashutosh', '', 'Aashutosh — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (86, 'Milan Bhujel', '', 'Milan Bhujel — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (87, 'Nawal Khan', '', 'Nawal Khan — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (88, 'Wilson Bikram Rai', '', 'Wilson Bikram Rai — popular festive artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000');
select setval(pg_get_serial_sequence('public.artists', 'id'), (select max(id) from public.artists));

insert into public.songs (id, title, title_ne, romanized_title, artist_id, featured_artists, composer, lyricist, album, film_or_source, release_year, language, primary_genre_id, mood_tags, decade, duration_seconds, artwork_url, playback_provider, provider_video_id, provider_url, source_url, attribution, metadata_verification_status, publication_status, play_count, is_featured, featured_order, created_at, updated_at) values
    (1062, 'Dashain Tihar', '', 'Dashain Tihar', 60, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "dashain", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/LnOajzcjBz4/hqdefault.jpg', 'youtube', 'LnOajzcjBz4', 'https://www.youtube.com/watch?v=LnOajzcjBz4', 'https://www.youtube.com/watch?v=LnOajzcjBz4', 'Sugam Pokharel', 'verified', 'published', 32800, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1063, 'Dashain Aayo (Muglan)', '', 'Dashain Aayo (Muglan)', 61, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "dashain", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/IGEZtIOLOMQ/hqdefault.jpg', 'youtube', 'IGEZtIOLOMQ', 'https://www.youtube.com/watch?v=IGEZtIOLOMQ', 'https://www.youtube.com/watch?v=IGEZtIOLOMQ', 'Budha Subba Digital', 'verified', 'published', 22800, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1064, 'Deusire Song (E Bhan Bhan Bhai Ho)', '', 'Deusire Song (E Bhan Bhan Bhai Ho)', 62, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "tihar", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/lODAb-HmC4Q/hqdefault.jpg', 'youtube', 'lODAb-HmC4Q', 'https://www.youtube.com/watch?v=lODAb-HmC4Q', 'https://www.youtube.com/watch?v=lODAb-HmC4Q', 'Tanka Budathoki', 'verified', 'published', 21733, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1065, 'Don Aayo Don', '', 'Don Aayo Don', 39, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "tihar", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/vEG_LpJsnCQ/hqdefault.jpg', 'youtube', 'vEG_LpJsnCQ', 'https://www.youtube.com/watch?v=vEG_LpJsnCQ', 'https://www.youtube.com/watch?v=vEG_LpJsnCQ', 'Durgesh Thapa', 'verified', 'published', 13267, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1066, 'Tihar Song (Axata)', '', 'Tihar Song (Axata)', 63, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "tihar", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/f9XCatKPg4k/hqdefault.jpg', 'youtube', 'f9XCatKPg4k', 'https://www.youtube.com/watch?v=f9XCatKPg4k', 'https://www.youtube.com/watch?v=f9XCatKPg4k', 'Kripa Drishya Digital', 'verified', 'published', 12067, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1067, 'Areli Kadaile Malai Chwassai', '', 'Areli Kadaile Malai Chwassai', 64, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "teej", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/25yDj9FWxzE/hqdefault.jpg', 'youtube', '25yDj9FWxzE', 'https://www.youtube.com/watch?v=25yDj9FWxzE', 'https://www.youtube.com/watch?v=25yDj9FWxzE', 'Shanti Shree Pariyar', 'verified', 'published', 48000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1068, 'Aayo Teejko Lahar', '', 'Aayo Teejko Lahar', 59, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "teej", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/Bn5Qpr79LQw/hqdefault.jpg', 'youtube', 'Bn5Qpr79LQw', 'https://www.youtube.com/watch?v=Bn5Qpr79LQw', 'https://www.youtube.com/watch?v=Bn5Qpr79LQw', 'Melina Rai', 'verified', 'published', 34133, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1069, 'Chitikkai Bha Chu Re', '', 'Chitikkai Bha Chu Re', 65, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "teej", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/16Qf5qMRtY4/hqdefault.jpg', 'youtube', '16Qf5qMRtY4', 'https://www.youtube.com/watch?v=16Qf5qMRtY4', 'https://www.youtube.com/watch?v=16Qf5qMRtY4', 'Sindhu Malla', 'verified', 'published', 26267, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1070, 'Gade Jeba Jhame', '', 'Gade Jeba Jhame', 66, '', '', '', '', '', NULL, 'Nepali', 11, '["festive", "sonam-lhosar", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/E4gGxv8syu0/hqdefault.jpg', 'youtube', 'E4gGxv8syu0', 'https://www.youtube.com/watch?v=E4gGxv8syu0', 'https://www.youtube.com/watch?v=E4gGxv8syu0', 'Bishal Kaltan', 'verified', 'published', 8667, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1071, 'Phoolko Aankhama', '', 'Phoolko Aankhama', 7, '', '', '', '', '', NULL, 'Nepali', 13, '["festive", "buddha-jayanti", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/bJNLrJ7MUzM/hqdefault.jpg', 'youtube', 'bJNLrJ7MUzM', 'https://www.youtube.com/watch?v=bJNLrJ7MUzM', 'https://www.youtube.com/watch?v=bJNLrJ7MUzM', 'Ani Choying Drolma', 'verified', 'published', 12000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1072, 'Om Mani Padme Hum', '', 'Om Mani Padme Hum', 67, '', '', '', '', '', NULL, 'Nepali', 13, '["festive", "buddha-jayanti", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/mvBLSJWk6HE/hqdefault.jpg', 'youtube', 'mvBLSJWk6HE', 'https://www.youtube.com/watch?v=mvBLSJWk6HE', 'https://www.youtube.com/watch?v=mvBLSJWk6HE', 'Essence of Universe', 'verified', 'published', 19333, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1073, 'Shiva Stuti (Mahashivaratri)', '', 'Shiva Stuti (Mahashivaratri)', 68, '', '', '', '', '', NULL, 'Hindi', 13, '["festive", "maha-shivaratri", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/toSqahDnlCU/hqdefault.jpg', 'youtube', 'toSqahDnlCU', 'https://www.youtube.com/watch?v=toSqahDnlCU', 'https://www.youtube.com/watch?v=toSqahDnlCU', 'Sonu Nigam', 'verified', 'published', 48000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1074, 'Shankar Bhole (Nepali Shiv Bhajan)', '', 'Shankar Bhole (Nepali Shiv Bhajan)', 69, '', '', '', '', '', NULL, 'Nepali', 13, '["festive", "maha-shivaratri", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/_VY6wZr9CY8/hqdefault.jpg', 'youtube', '_VY6wZr9CY8', 'https://www.youtube.com/watch?v=_VY6wZr9CY8', 'https://www.youtube.com/watch?v=_VY6wZr9CY8', 'Music Nepal', 'verified', 'published', 7533, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1075, 'Ho Deenanath (Chhath Geet)', '', 'Ho Deenanath (Chhath Geet)', 36, '', '', '', '', '', NULL, 'Hindi', 13, '["festive", "chhath", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/fOVGz9WFymU/hqdefault.jpg', 'youtube', 'fOVGz9WFymU', 'https://www.youtube.com/watch?v=fOVGz9WFymU', 'https://www.youtube.com/watch?v=fOVGz9WFymU', 'Sharda Sinha', 'verified', 'published', 37333, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1076, 'Chhathi Maiya Bulaye', '', 'Chhathi Maiya Bulaye', 70, '', '', '', '', '', NULL, 'Hindi', 13, '["festive", "chhath", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/OrlnX9zM5-k/hqdefault.jpg', 'youtube', 'OrlnX9zM5-k', 'https://www.youtube.com/watch?v=OrlnX9zM5-k', 'https://www.youtube.com/watch?v=OrlnX9zM5-k', 'Vishal Mishra', 'verified', 'published', 12667, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1077, 'Ale Bhena', '', 'Ale Bhena', 71, '', '', '', '', '', NULL, 'Nepali', 3, '["festive", "maghe-sankranti", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/sMOoa7jVhMo/hqdefault.jpg', 'youtube', 'sMOoa7jVhMo', 'https://www.youtube.com/watch?v=sMOoa7jVhMo', 'https://www.youtube.com/watch?v=sMOoa7jVhMo', 'Sidartha Ale Magar', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1078, 'Har Saal Aaith Maghi', '', 'Har Saal Aaith Maghi', 72, '', '', '', '', '', NULL, 'Nepali', 3, '["festive", "maghe-sankranti", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/64fy0YbLBI4/hqdefault.jpg', 'youtube', '64fy0YbLBI4', 'https://www.youtube.com/watch?v=64fy0YbLBI4', 'https://www.youtube.com/watch?v=64fy0YbLBI4', 'Hamar Music Pahura', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1079, 'Jaula Relaima Sarara', '', 'Jaula Relaima Sarara', 73, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "holi", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/QBgd8CdmA_E/hqdefault.jpg', 'youtube', 'QBgd8CdmA_E', 'https://www.youtube.com/watch?v=QBgd8CdmA_E', 'https://www.youtube.com/watch?v=QBgd8CdmA_E', 'Narayan Rayamajhi', 'verified', 'published', 19333, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1080, 'Kati Ramro Holi', '', 'Kati Ramro Holi', 74, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "holi", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/aDZn--1pfRw/hqdefault.jpg', 'youtube', 'aDZn--1pfRw', 'https://www.youtube.com/watch?v=aDZn--1pfRw', 'https://www.youtube.com/watch?v=aDZn--1pfRw', 'Chakra Bam', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1081, 'Ram Manaima (Lok Bhajan)', '', 'Ram Manaima (Lok Bhajan)', 75, '', '', '', '', '', NULL, 'Nepali', 13, '["festive", "ram-navami", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/8Oj5pmXngMw/hqdefault.jpg', 'youtube', '8Oj5pmXngMw', 'https://www.youtube.com/watch?v=8Oj5pmXngMw', 'https://www.youtube.com/watch?v=8Oj5pmXngMw', 'Surya Khadka', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1082, 'Ramko Paitalama', '', 'Ramko Paitalama', 76, '', '', '', '', '', NULL, 'Nepali', 13, '["festive", "ram-navami", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/iUTCI9RwgpM/hqdefault.jpg', 'youtube', 'iUTCI9RwgpM', 'https://www.youtube.com/watch?v=iUTCI9RwgpM', 'https://www.youtube.com/watch?v=iUTCI9RwgpM', 'Khuman Adhikari', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1083, 'Shri Krishna Govind Hare Murari', '', 'Shri Krishna Govind Hare Murari', 77, '', '', '', '', '', NULL, 'Hindi', 13, '["festive", "krishna-janmashtami", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/1qmPNot9NJs/hqdefault.jpg', 'youtube', '1qmPNot9NJs', 'https://www.youtube.com/watch?v=1qmPNot9NJs', 'https://www.youtube.com/watch?v=1qmPNot9NJs', 'Jubin Nautiyal', 'verified', 'published', 48000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1084, 'Achyutam Keshavam Krishna Damodaram', '', 'Achyutam Keshavam Krishna Damodaram', 78, '', '', '', '', '', NULL, 'Hindi', 13, '["festive", "krishna-janmashtami", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/pzzPowh241o/hqdefault.jpg', 'youtube', 'pzzPowh241o', 'https://www.youtube.com/watch?v=pzzPowh241o', 'https://www.youtube.com/watch?v=pzzPowh241o', 'Spiritual Mantra', 'verified', 'published', 48000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1085, 'Allari Balo Kallari', '', 'Allari Balo Kallari', 74, '', '', '', '', '', NULL, 'Nepali', 3, '["festive", "gaura-parva", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/Z3DWl4vGsD0/hqdefault.jpg', 'youtube', 'Z3DWl4vGsD0', 'https://www.youtube.com/watch?v=Z3DWl4vGsD0', 'https://www.youtube.com/watch?v=Z3DWl4vGsD0', 'Chakra Bam', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1086, 'Jiban Jatra Ho', '', 'Jiban Jatra Ho', 79, '', '', '', '', '', NULL, 'Nepali', 3, '["festive", "gai-jatra", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/XtI6VO4Lf2U/hqdefault.jpg', 'youtube', 'XtI6VO4Lf2U', 'https://www.youtube.com/watch?v=XtI6VO4Lf2U', 'https://www.youtube.com/watch?v=XtI6VO4Lf2U', 'OSR Digital', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1087, 'Man Magan', '', 'Man Magan', 80, '', '', '', '', '', NULL, 'Newari', 12, '["festive", "indra-jatra", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/A0GOxBvHNNg/hqdefault.jpg', 'youtube', 'A0GOxBvHNNg', 'https://www.youtube.com/watch?v=A0GOxBvHNNg', 'https://www.youtube.com/watch?v=A0GOxBvHNNg', 'Deepak Bajracharya', 'verified', 'published', 34667, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1088, 'Kumari', '', 'Kumari', 81, '', '', '', '', '', NULL, 'Newari', 12, '["festive", "indra-jatra", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/lSlm73Mocts/hqdefault.jpg', 'youtube', 'lSlm73Mocts', 'https://www.youtube.com/watch?v=lSlm73Mocts', 'https://www.youtube.com/watch?v=lSlm73Mocts', 'Ujan Shakya', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1089, 'Biska Jatra Song', '', 'Biska Jatra Song', 82, '', '', '', '', '', NULL, 'Newari', 12, '["festive", "bisket-jatra", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/jmA65gFB8LU/hqdefault.jpg', 'youtube', 'jmA65gFB8LU', 'https://www.youtube.com/watch?v=jmA65gFB8LU', 'https://www.youtube.com/watch?v=jmA65gFB8LU', 'Rajendra Shrestha', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1090, 'Apa Lai Mero', '', 'Apa Lai Mero', 83, '', '', '', '', '', NULL, 'Nepali', 11, '["festive", "tamu-lhosar", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/u1CIXq6c0gs/hqdefault.jpg', 'youtube', 'u1CIXq6c0gs', 'https://www.youtube.com/watch?v=u1CIXq6c0gs', 'https://www.youtube.com/watch?v=u1CIXq6c0gs', 'Ghampani', 'verified', 'published', 10333, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1091, 'Tibetan Losar Song', '', 'Tibetan Losar Song', 84, '', '', '', '', '', NULL, 'Nepali', 10, '["festive", "gyalpo-lhosar", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/2WLXnqYVW74/hqdefault.jpg', 'youtube', '2WLXnqYVW74', 'https://www.youtube.com/watch?v=2WLXnqYVW74', 'https://www.youtube.com/watch?v=2WLXnqYVW74', 'Karma Tseten', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1092, 'Yomari Punhi Nakha', '', 'Yomari Punhi Nakha', 85, '', '', '', '', '', NULL, 'Newari', 12, '["festive", "yomari-punhi", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/8UN29yxnook/hqdefault.jpg', 'youtube', '8UN29yxnook', 'https://www.youtube.com/watch?v=8UN29yxnook', 'https://www.youtube.com/watch?v=8UN29yxnook', 'Aashutosh', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1093, 'Christmas Bada Din', '', 'Christmas Bada Din', 56, '', '', '', '', '', NULL, 'Nepali', 13, '["festive", "christmas", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/s7fDnjIEnnA/hqdefault.jpg', 'youtube', 's7fDnjIEnnA', 'https://www.youtube.com/watch?v=s7fDnjIEnnA', 'https://www.youtube.com/watch?v=s7fDnjIEnnA', 'Adrian Dewan', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1094, 'Christmas Ko Ramjhamma', '', 'Christmas Ko Ramjhamma', 86, '', '', '', '', '', NULL, 'Nepali', 13, '["festive", "christmas", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/edg6Ac3noR8/hqdefault.jpg', 'youtube', 'edg6Ac3noR8', 'https://www.youtube.com/watch?v=edg6Ac3noR8', 'https://www.youtube.com/watch?v=edg6Ac3noR8', 'Milan Bhujel', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1095, 'Eid Mubarak', '', 'Eid Mubarak', 87, '', '', '', '', '', NULL, 'Nepali', 13, '["festive", "eid", "popular", "most-viewed", "bhajan", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/icRCSFnc6YA/hqdefault.jpg', 'youtube', 'icRCSFnc6YA', 'https://www.youtube.com/watch?v=icRCSFnc6YA', 'https://www.youtube.com/watch?v=icRCSFnc6YA', 'Nawal Khan', 'verified', 'published', 8000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1096, 'Udaayo Mann (Behuli)', '', 'Udaayo Mann (Behuli)', 79, '', '', '', '', '', NULL, 'Nepali', 3, '["festive", "udhauli-ubhauli", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/OwLvKrenonw/hqdefault.jpg', 'youtube', 'OwLvKrenonw', 'https://www.youtube.com/watch?v=OwLvKrenonw', 'https://www.youtube.com/watch?v=OwLvKrenonw', 'OSR Digital', 'verified', 'published', 30667, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000'),
    (1097, 'Sakelako Bela', '', 'Sakelako Bela', 88, '', '', '', '', '', NULL, 'Nepali', 3, '["festive", "udhauli-ubhauli", "popular", "most-viewed", "trending"]'::jsonb, '', NULL, 'https://img.youtube.com/vi/NEhqq5ulFhQ/hqdefault.jpg', 'youtube', 'NEhqq5ulFhQ', 'https://www.youtube.com/watch?v=NEhqq5ulFhQ', 'https://www.youtube.com/watch?v=NEhqq5ulFhQ', 'Wilson Bikram Rai', 'verified', 'published', 6000, false, 0, '2026-10-17T10:00:00.000000', '2026-10-17T10:00:00.000000');
select setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));


-- Famous, forum-sourced classics and heart-touching songs (ids 1098+): the
-- most-recommended timeless tracks across adhunik, folk, band, pop, NepHop
-- and regional traditions, plus the heart-wrenching "working abroad" era.
insert into public.artists (id, display_name, display_name_ne, biography, biography_ne, profile_image, verification_status, created_at, updated_at) values
    (89, 'Arun Thapa', '', 'Arun Thapa — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (90, 'Bachchu Kailash', '', 'Bachchu Kailash — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (91, 'Anju Panta', '', 'Anju Panta — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (92, 'Pradeep Raj Pandey', '', 'Pradeep Raj Pandey — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (93, 'Albatross', '', 'Albatross — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (94, 'Bipul Chettri', '', 'Bipul Chettri — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (95, 'The Uglyz', '', 'The Uglyz — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (96, 'Sabin Rai', '', 'Sabin Rai — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (97, 'Kandara', '', 'Kandara — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (98, 'The Axe Band', '', 'The Axe Band — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (99, 'Sajjan Raj Vaidya', '', 'Sajjan Raj Vaidya — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (100, 'Bartika Eam Rai', '', 'Bartika Eam Rai — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (101, 'Rohit John Chettri', '', 'Rohit John Chettri — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (102, 'Laure', '', 'Laure — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (103, 'Hemant Rana', '', 'Hemant Rana — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (104, 'Manish Dhakal', '', 'Manish Dhakal — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (105, 'Avinash Ghising', '', 'Avinash Ghising — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (106, 'Yama Buddha', '', 'Yama Buddha — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (107, 'Uniq Poet', '', 'Uniq Poet — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (108, 'MC FLO', '', 'MC FLO — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (109, 'VTEN', '', 'VTEN — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (110, 'Tara Thapa', '', 'Tara Thapa — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (111, 'Khemraj Gurung', '', 'Khemraj Gurung — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (112, 'Chanda Ghising', '', 'Chanda Ghising — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (113, 'Alisha Rai', '', 'Alisha Rai — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000');
select setval(pg_get_serial_sequence('public.artists', 'id'), (select max(id) from public.artists));

insert into public.songs (id, title, title_ne, romanized_title, artist_id, featured_artists, composer, lyricist, album, film_or_source, release_year, language, primary_genre_id, mood_tags, decade, duration_seconds, artwork_url, playback_provider, provider_video_id, provider_url, source_url, attribution, metadata_verification_status, publication_status, play_count, is_featured, featured_order, created_at, updated_at) values
    (1098, 'Malai Nasodha Kaha Dukcha Ghau', '', 'Malai Nasodha Kaha Dukcha Ghau', 1, '', '', '', '', '', 1975, 'Nepali', 5, '["emotional", "heart-touching", "nostalgic", "classic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/Pkj6YFJFI8U/hqdefault.jpg', 'youtube', 'Pkj6YFJFI8U', 'https://www.youtube.com/watch?v=Pkj6YFJFI8U', 'https://www.youtube.com/watch?v=Pkj6YFJFI8U', 'Music Nepal', 'verified', 'published', 4276, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1099, 'Yeti Dherai Maya Diee', '', 'Yeti Dherai Maya Diee', 1, '', '', '', '', '', 1974, 'Nepali', 5, '["emotional", "heart-touching", "nostalgic", "classic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/x7faDV25Dxs/hqdefault.jpg', 'youtube', 'x7faDV25Dxs', 'https://www.youtube.com/watch?v=x7faDV25Dxs', 'https://www.youtube.com/watch?v=x7faDV25Dxs', 'Music Nepal', 'verified', 'published', 4160, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1100, 'Pokhiyera Gham Ko Jhulka', '', 'Pokhiyera Gham Ko Jhulka', 1, '', '', '', '', '', 1976, 'Nepali', 5, '["emotional", "heart-touching", "classic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/iYylLsr7kx4/hqdefault.jpg', 'youtube', 'iYylLsr7kx4', 'https://www.youtube.com/watch?v=iYylLsr7kx4', 'https://www.youtube.com/watch?v=iYylLsr7kx4', 'Narayan Gopal - Topic', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1101, 'Preyasi Ka Yaad Haru', '', 'Preyasi Ka Yaad Haru', 1, '', '', '', '', '', 1972, 'Nepali', 5, '["emotional", "heart-touching", "longing", "classic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/_X6dG9WRHeQ/hqdefault.jpg', 'youtube', '_X6dG9WRHeQ', 'https://www.youtube.com/watch?v=_X6dG9WRHeQ', 'https://www.youtube.com/watch?v=_X6dG9WRHeQ', 'Sushant Adhikari', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1102, 'Aljhecha Kyare Pachyauri', '', 'Aljhecha Kyare Pachyauri', 1, '', '', '', '', '', 1970, 'Nepali', 5, '["emotional", "nostalgic", "classic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/MPCr81iI5UE/hqdefault.jpg', 'youtube', 'MPCr81iI5UE', 'https://www.youtube.com/watch?v=MPCr81iI5UE', 'https://www.youtube.com/watch?v=MPCr81iI5UE', 'Music Nepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1103, 'Hajar Sapana Haru Ko', '', 'Hajar Sapana Haru Ko', 4, '', '', '', '', '', 1980, 'Nepali', 5, '["emotional", "heart-touching", "classic"]'::jsonb, '1980s', NULL, 'https://img.youtube.com/vi/coNs0wSvovk/hqdefault.jpg', 'youtube', 'coNs0wSvovk', 'https://www.youtube.com/watch?v=coNs0wSvovk', 'https://www.youtube.com/watch?v=coNs0wSvovk', 'Ultimate Lyrics', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1104, 'Mutu Jali Rahechha', '', 'Mutu Jali Rahechha', 4, '', '', '', '', '', 1982, 'Nepali', 5, '["emotional", "heart-touching", "melancholic", "classic"]'::jsonb, '1980s', NULL, 'https://img.youtube.com/vi/gdl7rQ2zPzs/hqdefault.jpg', 'youtube', 'gdl7rQ2zPzs', 'https://www.youtube.com/watch?v=gdl7rQ2zPzs', 'https://www.youtube.com/watch?v=gdl7rQ2zPzs', 'Naba Raj Shrestha', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1105, 'Jati Chot Dinchhau', '', 'Jati Chot Dinchhau', 4, '', '', '', '', '', 1981, 'Nepali', 5, '["emotional", "heart-touching", "classic"]'::jsonb, '1980s', NULL, 'https://img.youtube.com/vi/r8B5aAusW-c/hqdefault.jpg', 'youtube', 'r8B5aAusW-c', 'https://www.youtube.com/watch?v=r8B5aAusW-c', 'https://www.youtube.com/watch?v=r8B5aAusW-c', 'Music Nepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1106, 'Maya Meri Sanjha Bani', '', 'Maya Meri Sanjha Bani', 4, '', '', '', '', '', 1983, 'Nepali', 5, '["romantic", "emotional", "classic"]'::jsonb, '1980s', NULL, 'https://img.youtube.com/vi/udpI-_HKVLE/hqdefault.jpg', 'youtube', 'udpI-_HKVLE', 'https://www.youtube.com/watch?v=udpI-_HKVLE', 'https://www.youtube.com/watch?v=udpI-_HKVLE', 'Music Nepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1107, 'Jati Maya Laye Pani', '', 'Jati Maya Laye Pani', 89, '', '', '', '', '', 1978, 'Nepali', 5, '["emotional", "heart-touching", "classic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/ODsy2VC9oPo/hqdefault.jpg', 'youtube', 'ODsy2VC9oPo', 'https://www.youtube.com/watch?v=ODsy2VC9oPo', 'https://www.youtube.com/watch?v=ODsy2VC9oPo', 'Music Nepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1108, 'Ritu Haru Ma Timi', '', 'Ritu Haru Ma Timi', 89, '', '', '', '', '', 1979, 'Nepali', 5, '["romantic", "emotional", "classic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/MhG7aNPq1_o/hqdefault.jpg', 'youtube', 'MhG7aNPq1_o', 'https://www.youtube.com/watch?v=MhG7aNPq1_o', 'https://www.youtube.com/watch?v=MhG7aNPq1_o', 'Music Nepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1109, 'Namana Laaj Estari', '', 'Namana Laaj Estari', 13, '', '', '', '', '', 1965, 'Nepali', 5, '["romantic", "nostalgic", "classic"]'::jsonb, '1960s', NULL, 'https://img.youtube.com/vi/GH9BQslHCQo/hqdefault.jpg', 'youtube', 'GH9BQslHCQo', 'https://www.youtube.com/watch?v=GH9BQslHCQo', 'https://www.youtube.com/watch?v=GH9BQslHCQo', 'HiTechEntertainment', 'verified', 'published', 7297, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1110, 'Para Laijau Phool Haru', '', 'Para Laijau Phool Haru', 13, '', '', '', '', '', 1968, 'Nepali', 5, '["emotional", "heart-touching", "classic"]'::jsonb, '1960s', NULL, 'https://img.youtube.com/vi/1tnvDCzf5Dc/hqdefault.jpg', 'youtube', '1tnvDCzf5Dc', 'https://www.youtube.com/watch?v=1tnvDCzf5Dc', 'https://www.youtube.com/watch?v=1tnvDCzf5Dc', 'Prem Dhoj Pradhan', 'verified', 'published', 3379, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1111, 'Subhakamana Bhari', '', 'Subhakamana Bhari', 2, '', '', '', '', '', 1966, 'Nepali', 3, '["emotional", "nostalgic", "classic"]'::jsonb, '1960s', NULL, 'https://img.youtube.com/vi/Je9eyWu59-I/hqdefault.jpg', 'youtube', 'Je9eyWu59-I', 'https://www.youtube.com/watch?v=Je9eyWu59-I', 'https://www.youtube.com/watch?v=Je9eyWu59-I', 'Music Nepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1112, 'Timle Ta Hoina', '', 'Timle Ta Hoina', 90, '', '', '', '', '', 1975, 'Nepali', 5, '["romantic", "emotional", "classic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/iuE3ckTNZiQ/hqdefault.jpg', 'youtube', 'iuE3ckTNZiQ', 'https://www.youtube.com/watch?v=iuE3ckTNZiQ', 'https://www.youtube.com/watch?v=iuE3ckTNZiQ', 'Natikaji Shrestha', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1113, 'Na Birse Timilai Na Paye Timilai', '', 'Na Birse Timilai Na Paye Timilai', 91, '', '', '', '', '', 2003, 'Nepali', 8, '["emotional", "heart-touching", "breakup"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/Lhe7jyh6oo4/hqdefault.jpg', 'youtube', 'Lhe7jyh6oo4', 'https://www.youtube.com/watch?v=Lhe7jyh6oo4', 'https://www.youtube.com/watch?v=Lhe7jyh6oo4', 'OSR Movies', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1114, 'Thahai Thiyena Dil', '', 'Thahai Thiyena Dil', 92, '', '', '', '', '', 1968, 'Nepali', 5, '["emotional", "heart-touching", "classic"]'::jsonb, '1960s', NULL, 'https://img.youtube.com/vi/6ycS99QdomQ/hqdefault.jpg', 'youtube', '6ycS99QdomQ', 'https://www.youtube.com/watch?v=6ycS99QdomQ', 'https://www.youtube.com/watch?v=6ycS99QdomQ', 'BB Thapa Entertainment', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1115, 'Bhedako Oon Jasto', '', 'Bhedako Oon Jasto', 5, '', '', '', '', '', 1997, 'Nepali', 7, '["folk-rock", "band", "evergreen"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/Jy0gLuvTfXk/hqdefault.jpg', 'youtube', 'Jy0gLuvTfXk', 'https://www.youtube.com/watch?v=Jy0gLuvTfXk', 'https://www.youtube.com/watch?v=Jy0gLuvTfXk', 'Nepathya', 'verified', 'published', 4232, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1116, 'Taal Ko Pani', '', 'Taal Ko Pani', 5, '', '', '', '', '', 1999, 'Nepali', 7, '["folk-rock", "band", "evergreen"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/QKtkVmQaKzk/hqdefault.jpg', 'youtube', 'QKtkVmQaKzk', 'https://www.youtube.com/watch?v=QKtkVmQaKzk', 'https://www.youtube.com/watch?v=QKtkVmQaKzk', 'Nepathya - Topic', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1117, 'Pinjada Ko Suga', '', 'Pinjada Ko Suga', 6, '', '', '', '', '', 1996, 'Nepali', 7, '["rock", "band", "evergreen"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/rs_rTKjfHD4/hqdefault.jpg', 'youtube', 'rs_rTKjfHD4', 'https://www.youtube.com/watch?v=rs_rTKjfHD4', 'https://www.youtube.com/watch?v=rs_rTKjfHD4', 'Suyog Khanal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1118, 'Timi Bhane', '', 'Timi Bhane', 93, '', '', '', '', '', 2008, 'Nepali', 7, '["rock", "band", "emotional", "evergreen"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/UC3k11aJnnU/hqdefault.jpg', 'youtube', 'UC3k11aJnnU', 'https://www.youtube.com/watch?v=UC3k11aJnnU', 'https://www.youtube.com/watch?v=UC3k11aJnnU', 'Albatross Nepal - Official', 'verified', 'published', 30543, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1119, 'Khaseka Tara', '', 'Khaseka Tara', 93, '', '', '', '', '', 2007, 'Nepali', 7, '["rock", "band", "melancholic"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/0nP9axR2mVU/hqdefault.jpg', 'youtube', '0nP9axR2mVU', 'https://www.youtube.com/watch?v=0nP9axR2mVU', 'https://www.youtube.com/watch?v=0nP9axR2mVU', 'Albatross Nepal - Official', 'verified', 'published', 10685, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1120, 'Wildfire (Dadhelo)', '', 'Wildfire (Dadhelo)', 94, '', '', '', '', '', 2015, 'Nepali', 9, '["acoustic", "indie", "nostalgic"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/7yLWjCai4-s/hqdefault.jpg', 'youtube', '7yLWjCai4-s', 'https://www.youtube.com/watch?v=7yLWjCai4-s', 'https://www.youtube.com/watch?v=7yLWjCai4-s', 'Bipul Chettri', 'verified', 'published', 8722, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1121, 'Asaar', '', 'Asaar', 94, '', '', '', '', '', 2016, 'Nepali', 9, '["acoustic", "indie", "monsoon"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/bNoGXzEL1mA/hqdefault.jpg', 'youtube', 'bNoGXzEL1mA', 'https://www.youtube.com/watch?v=bNoGXzEL1mA', 'https://www.youtube.com/watch?v=bNoGXzEL1mA', 'Bipul Chettri', 'verified', 'published', 20769, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1122, 'Aaudai Jadai', '', 'Aaudai Jadai', 95, '', '', '', '', '', 2009, 'Nepali', 6, '["pop", "romantic", "evergreen"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/NA6Baz79LlE/hqdefault.jpg', 'youtube', 'NA6Baz79LlE', 'https://www.youtube.com/watch?v=NA6Baz79LlE', 'https://www.youtube.com/watch?v=NA6Baz79LlE', 'The Uglyz', 'verified', 'published', 26199, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1123, 'Jau Ki Basu', '', 'Jau Ki Basu', 96, '', '', '', '', '', 2008, 'Nepali', 6, '["pop", "romantic", "evergreen"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/nDvZU1FKdAQ/hqdefault.jpg', 'youtube', 'nDvZU1FKdAQ', 'https://www.youtube.com/watch?v=nDvZU1FKdAQ', 'https://www.youtube.com/watch?v=nDvZU1FKdAQ', 'Sabin Rai & The Pharaoh', 'verified', 'published', 33712, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1124, 'Hongkong Pokhara', '', 'Hongkong Pokhara', 97, '', '', '', '', '', 1997, 'Nepali', 6, '["pop", "migration", "melancholic", "evergreen"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/YzZr55v1QRY/hqdefault.jpg', 'youtube', 'YzZr55v1QRY', 'https://www.youtube.com/watch?v=YzZr55v1QRY', 'https://www.youtube.com/watch?v=YzZr55v1QRY', 'Kandara', 'verified', 'published', 15579, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1125, 'Chiya Barima', '', 'Chiya Barima', 98, '', '', '', '', '', 1996, 'Nepali', 6, '["pop", "romantic", "evergreen"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/OL5WAPvfsnE/hqdefault.jpg', 'youtube', 'OL5WAPvfsnE', 'https://www.youtube.com/watch?v=OL5WAPvfsnE', 'https://www.youtube.com/watch?v=OL5WAPvfsnE', 'The Axe - Topic', 'verified', 'published', 4385, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1126, 'Huri Batas', '', 'Huri Batas', 14, '', '', '', '', '', 2004, 'Nepali', 6, '["pop", "romantic"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/gVoWjCt0qXg/hqdefault.jpg', 'youtube', 'gVoWjCt0qXg', 'https://www.youtube.com/watch?v=gVoWjCt0qXg', 'https://www.youtube.com/watch?v=gVoWjCt0qXg', 'NIMA RUMBA - Topic', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1127, 'Hawaijahaj', '', 'Hawaijahaj', 99, '', '', '', '', '', 2018, 'Nepali', 9, '["indie", "acoustic", "romantic"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/Kni9OFsh8UM/hqdefault.jpg', 'youtube', 'Kni9OFsh8UM', 'https://www.youtube.com/watch?v=Kni9OFsh8UM', 'https://www.youtube.com/watch?v=Kni9OFsh8UM', 'Sajjan', 'verified', 'published', 45545, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1128, 'Najeek', '', 'Najeek', 100, '', '', '', '', '', 2018, 'Nepali', 9, '["indie", "emotional", "heart-touching"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/AMRGmAh2NTk/hqdefault.jpg', 'youtube', 'AMRGmAh2NTk', 'https://www.youtube.com/watch?v=AMRGmAh2NTk', 'https://www.youtube.com/watch?v=AMRGmAh2NTk', 'Bartika Eam Rai', 'verified', 'published', 48000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1129, 'Bistarai Bistarai', '', 'Bistarai Bistarai', 101, '', '', '', '', '', 2017, 'Nepali', 6, '["pop", "acoustic", "romantic"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/u1ZJpqnvWiU/hqdefault.jpg', 'youtube', 'u1ZJpqnvWiU', 'https://www.youtube.com/watch?v=u1ZJpqnvWiU', 'https://www.youtube.com/watch?v=u1ZJpqnvWiU', 'Rohit John Chettri (RJC)', 'verified', 'published', 23062, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1130, 'Pheri Tyo Din', '', 'Pheri Tyo Din', 60, '', '', '', '', '', 2005, 'Nepali', 6, '["pop", "emotional", "heart-touching"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/iOevI_gKeK4/hqdefault.jpg', 'youtube', 'iOevI_gKeK4', 'https://www.youtube.com/watch?v=iOevI_gKeK4', 'https://www.youtube.com/watch?v=iOevI_gKeK4', 'Sugam Pokharel', 'verified', 'published', 13078, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1131, 'Mero Solta', '', 'Mero Solta', 102, '', '', '', '', '', 2013, 'Nepali', 14, '["hiphop", "nephop", "emotional", "heart-touching", "migration"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/34duoAEI44M/hqdefault.jpg', 'youtube', '34duoAEI44M', 'https://www.youtube.com/watch?v=34duoAEI44M', 'https://www.youtube.com/watch?v=34duoAEI44M', 'Laure', 'verified', 'published', 23590, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1132, 'Saili', '', 'Saili', 103, '', '', '', '', '', 2017, 'Nepali', 6, '["pop", "emotional", "heart-touching", "migration"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/4R7BxxuGmmE/hqdefault.jpg', 'youtube', '4R7BxxuGmmE', 'https://www.youtube.com/watch?v=4R7BxxuGmmE', 'https://www.youtube.com/watch?v=4R7BxxuGmmE', 'GH Entertainment Nepal', 'verified', 'published', 48000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1133, 'Pardeshi Nabhana', '', 'Pardeshi Nabhana', 104, '', '', '', '', '', 2016, 'Nepali', 6, '["pop", "emotional", "heart-touching", "migration"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/VRXgRsRri3U/hqdefault.jpg', 'youtube', 'VRXgRsRri3U', 'https://www.youtube.com/watch?v=VRXgRsRri3U', 'https://www.youtube.com/watch?v=VRXgRsRri3U', 'SongsNepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1134, 'Sunko Bala', '', 'Sunko Bala', 105, '', '', '', '', '', 2017, 'Nepali', 6, '["pop", "emotional", "heart-touching", "migration"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/zp4qo-zg_s4/hqdefault.jpg', 'youtube', 'zp4qo-zg_s4', 'https://www.youtube.com/watch?v=zp4qo-zg_s4', 'https://www.youtube.com/watch?v=zp4qo-zg_s4', 'Abhinas Ghising', 'verified', 'published', 3406, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1135, 'Yo Prasanga', '', 'Yo Prasanga', 106, '', '', '', '', '', 2013, 'Nepali', 14, '["hiphop", "nephop", "rap", "emotional"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/_IFk3GB91G0/hqdefault.jpg', 'youtube', '_IFk3GB91G0', 'https://www.youtube.com/watch?v=_IFk3GB91G0', 'https://www.youtube.com/watch?v=_IFk3GB91G0', 'Yama Buddha', 'verified', 'published', 9252, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1136, 'Saathi', '', 'Saathi', 106, '', '', '', '', '', 2014, 'Nepali', 14, '["hiphop", "nephop", "rap", "emotional", "heart-touching"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/H-ExNmHo2xI/hqdefault.jpg', 'youtube', 'H-ExNmHo2xI', 'https://www.youtube.com/watch?v=H-ExNmHo2xI', 'https://www.youtube.com/watch?v=H-ExNmHo2xI', 'Yama Buddha', 'verified', 'published', 48000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1137, '1994', '', '1994', 107, '', '', '', '', '', 2016, 'Nepali', 14, '["hiphop", "nephop", "rap"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/tjsiKFR_Y3w/hqdefault.jpg', 'youtube', 'tjsiKFR_Y3w', 'https://www.youtube.com/watch?v=tjsiKFR_Y3w', 'https://www.youtube.com/watch?v=tjsiKFR_Y3w', 'UNIQ POET', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1138, 'Maile Hasna Sikey', '', 'Maile Hasna Sikey', 108, '', '', '', '', '', 2018, 'Nepali', 14, '["hiphop", "nephop", "rap", "emotional"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/vWS4iQOOP8Y/hqdefault.jpg', 'youtube', 'vWS4iQOOP8Y', 'https://www.youtube.com/watch?v=vWS4iQOOP8Y', 'https://www.youtube.com/watch?v=vWS4iQOOP8Y', 'Mc Flo', 'verified', 'published', 5222, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1139, 'Katha', '', 'Katha', 109, '', '', '', '', '', 2018, 'Nepali', 14, '["hiphop", "nephop", "rap"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/mjG_hkgdpHk/hqdefault.jpg', 'youtube', 'mjG_hkgdpHk', 'https://www.youtube.com/watch?v=mjG_hkgdpHk', 'https://www.youtube.com/watch?v=mjG_hkgdpHk', 'VTEN MUSIC', 'verified', 'published', 42624, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1140, 'Rajamati Kumati', '', 'Rajamati Kumati', 13, '', '', '', '', '', 1963, 'Newari', 12, '["newari", "heritage", "classic"]'::jsonb, '1960s', NULL, 'https://img.youtube.com/vi/UXxTH0ydn0E/hqdefault.jpg', 'youtube', 'UXxTH0ydn0E', 'https://www.youtube.com/watch?v=UXxTH0ydn0E', 'https://www.youtube.com/watch?v=UXxTH0ydn0E', 'Prem Dhoj Pradhan', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1141, 'Tungna Ra Damphu', '', 'Tungna Ra Damphu', 65, '', '', '', '', '', 2000, 'Nepali', 11, '["tamang", "selo", "folk", "dance"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/QQjHRGwDft4/hqdefault.jpg', 'youtube', 'QQjHRGwDft4', 'https://www.youtube.com/watch?v=QQjHRGwDft4', 'https://www.youtube.com/watch?v=QQjHRGwDft4', 'CLICK DIGITAL', 'verified', 'published', 6902, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1142, 'Lahanale Jurayoki', '', 'Lahanale Jurayoki', 79, '', '', '', '', '', 1994, 'Nepali', 3, '["folk", "movie", "evergreen"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/iwMBR0o3yfg/hqdefault.jpg', 'youtube', 'iwMBR0o3yfg', 'https://www.youtube.com/watch?v=iwMBR0o3yfg', 'https://www.youtube.com/watch?v=iwMBR0o3yfg', 'OSR Digital', 'verified', 'published', 13045, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1143, 'Chyangba Hoi Chyangba', '', 'Chyangba Hoi Chyangba', 10, '', '', '', '', '', 1980, 'Nepali', 3, '["folk", "evergreen"]'::jsonb, '1980s', NULL, 'https://img.youtube.com/vi/dcRh45HwRTs/hqdefault.jpg', 'youtube', 'dcRh45HwRTs', 'https://www.youtube.com/watch?v=dcRh45HwRTs', 'https://www.youtube.com/watch?v=dcRh45HwRTs', 'Music Nepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1144, 'Kalilo Tamalai', '', 'Kalilo Tamalai', 110, '', '', '', '', '', 1990, 'Nepali', 3, '["folk", "evergreen"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/Hl2lnqYvheY/hqdefault.jpg', 'youtube', 'Hl2lnqYvheY', 'https://www.youtube.com/watch?v=Hl2lnqYvheY', 'https://www.youtube.com/watch?v=Hl2lnqYvheY', 'Tara Thapa', 'verified', 'published', 3050, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1145, 'Wari Jamuna Pari Jamuna', '', 'Wari Jamuna Pari Jamuna', 111, '', '', '', '', '', 1995, 'Nepali', 3, '["folk", "evergreen"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/4YZwXg8r4KE/hqdefault.jpg', 'youtube', '4YZwXg8r4KE', 'https://www.youtube.com/watch?v=4YZwXg8r4KE', 'https://www.youtube.com/watch?v=4YZwXg8r4KE', 'Music Nepal', 'verified', 'published', 3669, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1146, 'Aandhi Khola Urlera Aayo', '', 'Aandhi Khola Urlera Aayo', 69, '', '', '', '', '', 2010, 'Nepali', 4, '["folk", "jhyaure", "dance"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/vUpKLzje9gs/hqdefault.jpg', 'youtube', 'vUpKLzje9gs', 'https://www.youtube.com/watch?v=vUpKLzje9gs', 'https://www.youtube.com/watch?v=vUpKLzje9gs', 'Music Nepal', 'verified', 'published', 4883, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1147, 'Jhumka Giryo Re', '', 'Jhumka Giryo Re', 112, '', '', '', '', '', 2019, 'Nepali', 4, '["folk", "dance", "party"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/iuSU-PpfOt0/hqdefault.jpg', 'youtube', 'iuSU-PpfOt0', 'https://www.youtube.com/watch?v=iuSU-PpfOt0', 'https://www.youtube.com/watch?v=iuSU-PpfOt0', 'Action Entertainment', 'verified', 'published', 15712, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1148, 'Thamel Bazar', '', 'Thamel Bazar', 113, '', '', '', '', '', 2019, 'Nepali', 4, '["folk", "dance", "party"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/JXzswyfFg70/hqdefault.jpg', 'youtube', 'JXzswyfFg70', 'https://www.youtube.com/watch?v=JXzswyfFg70', 'https://www.youtube.com/watch?v=JXzswyfFg70', 'HighlightsNepal', 'verified', 'published', 48000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000');
select setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));


-- Bhajans, classical and traditional picks plus further heart-touching classics:
insert into public.artists (id, display_name, display_name_ne, biography, biography_ne, profile_image, verification_status, created_at, updated_at) values
    (114, 'Robin Sharma', '', 'Robin Sharma — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (115, 'Phatteman Rajbhandari', '', 'Phatteman Rajbhandari — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (116, 'Deep Shrestha', '', 'Deep Shrestha — celebrated Nepali artist curated from listener and forum favourites.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000');
select setval(pg_get_serial_sequence('public.artists', 'id'), (select max(id) from public.artists));

insert into public.songs (id, title, title_ne, romanized_title, artist_id, featured_artists, composer, lyricist, album, film_or_source, release_year, language, primary_genre_id, mood_tags, decade, duration_seconds, artwork_url, playback_provider, provider_video_id, provider_url, source_url, attribution, metadata_verification_status, publication_status, play_count, is_featured, featured_order, created_at, updated_at) values
    (1149, 'Tan Man Bachanle', '', 'Tan Man Bachanle', 4, '', '', '', '', '', 1980, 'Nepali', 13, '["bhajan", "kirtan", "peaceful"]'::jsonb, '1980s', NULL, 'https://img.youtube.com/vi/pjkyiU7f8eU/hqdefault.jpg', 'youtube', 'pjkyiU7f8eU', 'https://www.youtube.com/watch?v=pjkyiU7f8eU', 'https://www.youtube.com/watch?v=pjkyiU7f8eU', 'Ultimate Lyrics', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1150, 'Rahenachha Mero Kohi Bhagawan', '', 'Rahenachha Mero Kohi Bhagawan', 4, '', '', '', '', '', 1981, 'Nepali', 13, '["bhajan", "kirtan", "peaceful"]'::jsonb, '1980s', NULL, 'https://img.youtube.com/vi/ukheIPHSiR0/hqdefault.jpg', 'youtube', 'ukheIPHSiR0', 'https://www.youtube.com/watch?v=ukheIPHSiR0', 'https://www.youtube.com/watch?v=ukheIPHSiR0', 'Bhakta Raj Acharya - Topic', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1151, 'Jai Guru Ganapati', '', 'Jai Guru Ganapati', 4, '', '', '', '', '', 1980, 'Nepali', 13, '["bhajan", "kirtan", "festive"]'::jsonb, '1980s', NULL, 'https://img.youtube.com/vi/XpPkkSDKtdQ/hqdefault.jpg', 'youtube', 'XpPkkSDKtdQ', 'https://www.youtube.com/watch?v=XpPkkSDKtdQ', 'https://www.youtube.com/watch?v=XpPkkSDKtdQ', 'Bhakta Raj Acharya - Topic', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1152, 'Kun Mandir Ma Janchau Yatri', '', 'Kun Mandir Ma Janchau Yatri', 114, '', '', '', '', '', 2018, 'Nepali', 13, '["bhajan", "kirtan", "peaceful", "classic"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/LZWji01oo04/hqdefault.jpg', 'youtube', 'LZWji01oo04', 'https://www.youtube.com/watch?v=LZWji01oo04', 'https://www.youtube.com/watch?v=LZWji01oo04', 'Music Nepal', 'verified', 'published', 8213, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1153, 'Om Tare Tuttare Ture Soha', '', 'Om Tare Tuttare Ture Soha', 7, '', '', '', '', '', 2006, 'Tibetan', 1, '["mantra", "meditation", "peaceful"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/8VwyP-yMybQ/hqdefault.jpg', 'youtube', '8VwyP-yMybQ', 'https://www.youtube.com/watch?v=8VwyP-yMybQ', 'https://www.youtube.com/watch?v=8VwyP-yMybQ', 'Ani Choying Drolma', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1154, 'Namo Ratna (Great Compassion Mantra)', '', 'Namo Ratna (Great Compassion Mantra)', 7, '', '', '', '', '', 2006, 'Tibetan', 1, '["mantra", "meditation", "peaceful"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/AAdSUAJ7ngQ/hqdefault.jpg', 'youtube', 'AAdSUAJ7ngQ', 'https://www.youtube.com/watch?v=AAdSUAJ7ngQ', 'https://www.youtube.com/watch?v=AAdSUAJ7ngQ', 'Ani Choying Drolma', 'verified', 'published', 8484, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1155, 'Mero Pauma', '', 'Mero Pauma', 10, '', '', '', '', '', 1975, 'Nepali', 1, '["classical", "evergreen", "melodic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/K_2-Jx8vuA0/hqdefault.jpg', 'youtube', 'K_2-Jx8vuA0', 'https://www.youtube.com/watch?v=K_2-Jx8vuA0', 'https://www.youtube.com/watch?v=K_2-Jx8vuA0', 'Music Nepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1156, 'Yesto Pani Hudo Raicha', '', 'Yesto Pani Hudo Raicha', 115, '', '', '', '', '', 1971, 'Nepali', 5, '["emotional", "heart-touching", "classic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/fUebAVu-Pcw/hqdefault.jpg', 'youtube', 'fUebAVu-Pcw', 'https://www.youtube.com/watch?v=fUebAVu-Pcw', 'https://www.youtube.com/watch?v=fUebAVu-Pcw', 'Paleti', 'verified', 'published', 3846, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1157, 'Kati Kamjor Rahechha Bhagya', '', 'Kati Kamjor Rahechha Bhagya', 116, '', '', '', '', '', 1980, 'Nepali', 5, '["emotional", "heart-touching", "melancholic", "classic"]'::jsonb, '1980s', NULL, 'https://img.youtube.com/vi/z1RUtO5hiXc/hqdefault.jpg', 'youtube', 'z1RUtO5hiXc', 'https://www.youtube.com/watch?v=z1RUtO5hiXc', 'https://www.youtube.com/watch?v=z1RUtO5hiXc', 'Deep Shrestha', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1158, 'Chot Ke Ho Byatha Ke Ho', '', 'Chot Ke Ho Byatha Ke Ho', 89, '', '', '', '', '', 1979, 'Nepali', 5, '["emotional", "heart-touching", "classic"]'::jsonb, '1970s', NULL, 'https://img.youtube.com/vi/qKTGZ2mjRUM/hqdefault.jpg', 'youtube', 'qKTGZ2mjRUM', 'https://www.youtube.com/watch?v=qKTGZ2mjRUM', 'https://www.youtube.com/watch?v=qKTGZ2mjRUM', 'Music Nepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000');
select setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));

update public.songs
set festival_id = c.id
from (values
    (1062, 1),
    (1063, 1),
    (1064, 2),
    (1065, 2),
    (1066, 2),
    (1067, 3),
    (1068, 3),
    (1069, 3),
    (1070, 5),
    (1071, 6),
    (1072, 6),
    (1073, 7),
    (1074, 7),
    (1075, 8),
    (1076, 8),
    (1077, 9),
    (1078, 9),
    (1079, 10),
    (1080, 10),
    (1081, 11),
    (1082, 11),
    (1083, 13),
    (1084, 13),
    (1085, 14),
    (1086, 15),
    (1087, 16),
    (1088, 16),
    (1089, 17),
    (1090, 18),
    (1091, 19),
    (1092, 20),
    (1093, 21),
    (1094, 21),
    (1095, 22),
    (1096, 23),
    (1097, 23)
) as mapping(song_id, festival_id)
join public.festival_categories c on c.id = mapping.festival_id
where public.songs.id = mapping.song_id;

-- Tag the festive songs with their festival.
update public.songs
set festival_id = c.id
from (values
    (1001, 1),                    -- Dashain
    (1002, 1),                    -- Dashain
    (1003, 2),                    -- Tihar
    (1004, 2),                    -- Tihar
    (1005, 2),                    -- Tihar
    (1006, 3),                    -- Teej
    (1007, 3),                    -- Teej
    (1008, 3),                    -- Teej
    (1009, 3),                    -- Teej
    (1010, 4),                    -- Chitrabhan
    (1011, 4),                    -- Chitrabhan
    (1012, 5),                    -- Sonam Lhosar
    (1013, 5),                    -- Sonam Lhosar
    (1014, 6),                    -- Buddha Jayanti
    (1015, 6),                    -- Buddha Jayanti
    (1016, 7),                    -- Maha Shivaratri
    (1017, 7),                    -- Maha Shivaratri
    (1018, 1), (1019, 1), (1020, 1),  -- Dashain (heart-touching)
    (1021, 2), (1022, 2), (1023, 2),  -- Tihar (heart-touching)
    (1024, 3), (1025, 3),             -- Teej (heart-touching)
    (1026, 4),                        -- Chitrabhan
    (1027, 5),                        -- Sonam Lhosar
    (1028, 6),                        -- Buddha Jayanti
    (1029, 7),                        -- Maha Shivaratri
    -- Calendar-era additions (1030-1061)
    (1030, 8), (1031, 8),             -- Chhath
    (1032, 9), (1033, 9),             -- Maghe Sankranti
    (1034, 10), (1035, 10),           -- Holi
    (1036, 11), (1037, 11),           -- Ram Navami
    (1038, 12), (1039, 12),           -- Janai Purnima
    (1040, 13), (1041, 13),           -- Krishna Janmashtami
    (1042, 14), (1043, 14),           -- Gaura Parva
    (1044, 15), (1045, 15),           -- Gai Jatra
    (1046, 16), (1047, 16),           -- Indra Jatra
    (1048, 17), (1049, 17),           -- Bisket Jatra
    (1050, 18), (1051, 18),           -- Tamu Lhosar
    (1052, 19), (1053, 19),           -- Gyalpo Lhosar
    (1054, 20), (1055, 20),           -- Yomari Punhi
    (1056, 21), (1057, 21),           -- Christmas
    (1058, 22), (1059, 22),           -- Eid
    (1060, 23), (1061, 23)            -- Udhauli / Ubhauli
) as mapping(song_id, festival_id)
join public.festival_categories c on c.id = mapping.festival_id
where public.songs.id = mapping.song_id;


-- Additional festival songs (expanded coverage per festival).
insert into public.artists (id, display_name, display_name_ne, biography, biography_ne, profile_image, verification_status, created_at, updated_at) values
    (117, 'Trishna Gurung', '', 'Trishna Gurung — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (118, 'HiTechEntertainment', '', 'HiTechEntertainment — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (119, 'Sunil BC', '', 'Sunil BC — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (120, 'HighlightsNepal', '', 'HighlightsNepal — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (121, 'Pashupati Sharma', '', 'Pashupati Sharma — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (122, 'LAXMA', '', 'LAXMA — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (123, 'Kali Prasad Baskota', '', 'Kali Prasad Baskota — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (124, 'Janmabhoomi Online', '', 'Janmabhoomi Online — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (125, 'Prakash Shrestha', '', 'Prakash Shrestha — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (126, 'Anil Syangbo', '', 'Anil Syangbo — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (127, 'Suman Ghale', '', 'Suman Ghale — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (128, 'Ratna Bahadur Ghising', '', 'Ratna Bahadur Ghising — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (129, 'Raju Adhikari', '', 'Raju Adhikari — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (130, 'Samjhana Official', '', 'Samjhana Official — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (131, 'Anuradha Paudwal', '', 'Anuradha Paudwal — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (132, 'Pawan Singh', '', 'Pawan Singh — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (133, 'Maithili Online', '', 'Maithili Online — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (134, 'Resham Chaudhary', '', 'Resham Chaudhary — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (135, 'Chandra Jyoti Ale', '', 'Chandra Jyoti Ale — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (136, 'Ramesh Raj Bhattarai', '', 'Ramesh Raj Bhattarai — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (137, 'Uttam Baral', '', 'Uttam Baral — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (138, 'Diwas Gautam', '', 'Diwas Gautam — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (139, 'Raha', '', 'Raha — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (140, 'Sannu Kumar', '', 'Sannu Kumar — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (141, 'BK Dipak Nepal', '', 'BK Dipak Nepal — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (142, 'Rekha Joshi', '', 'Rekha Joshi — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (143, 'DR Chautari', '', 'DR Chautari — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (144, 'Khwopa Media Circle', '', 'Khwopa Media Circle — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (145, 'Nawaraj Kapri', '', 'Nawaraj Kapri — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (146, 'Mitesh Tamrakar', '', 'Mitesh Tamrakar — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (147, 'Mertz Creation', '', 'Mertz Creation — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (148, 'Vajra Tunes', '', 'Vajra Tunes — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (149, 'Anish Jo C', '', 'Anish Jo C — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (150, 'Rodhi Music', '', 'Rodhi Music — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (151, 'Raju Gurung', '', 'Raju Gurung — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (152, 'Pabitra Gurung', '', 'Pabitra Gurung — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (153, 'Sonam Londen', '', 'Sonam Londen — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (154, 'Furba Sherpa', '', 'Furba Sherpa — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (155, 'Sabita Malakar', '', 'Sabita Malakar — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (156, 'Raz Rai', '', 'Raz Rai — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (157, 'Ahmed Shah', '', 'Ahmed Shah — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (158, 'Nikesh Rai', '', 'Nikesh Rai — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (159, 'Binod Kham', '', 'Binod Kham — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000');
select setval(pg_get_serial_sequence('public.artists', 'id'), (select max(id) from public.artists));

insert into public.songs (id, title, title_ne, romanized_title, artist_id, featured_artists, composer, lyricist, album, film_or_source, release_year, language, primary_genre_id, mood_tags, decade, duration_seconds, artwork_url, playback_provider, provider_video_id, provider_url, source_url, attribution, metadata_verification_status, publication_status, play_count, is_featured, featured_order, created_at, updated_at) values
    (1159, 'Dashain Tihar (Trishna Gurung)', '', 'Dashain Tihar (Trishna Gurung)', 117, '', '', '', '', '', 2020, 'Nepali', 10, '["festive", "dashain", "tihar", "popular"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/RqQ0nrcOzQk/hqdefault.jpg', 'youtube', 'RqQ0nrcOzQk', 'https://www.youtube.com/watch?v=RqQ0nrcOzQk', 'https://www.youtube.com/watch?v=RqQ0nrcOzQk', 'Trishna Gurung', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1160, 'Nau Ratha Ko Diyo Baati', '', 'Nau Ratha Ko Diyo Baati', 118, '', '', '', '', '', 1998, 'Nepali', 10, '["festive", "dashain", "malshree", "classic"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/iZzzgr9J7Ag/hqdefault.jpg', 'youtube', 'iZzzgr9J7Ag', 'https://www.youtube.com/watch?v=iZzzgr9J7Ag', 'https://www.youtube.com/watch?v=iZzzgr9J7Ag', 'HiTechEntertainment', 'verified', 'published', 6199, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1161, 'Tika Jamara', '', 'Tika Jamara', 119, '', '', '', '', '', 2016, 'Nepali', 10, '["festive", "dashain", "traditional"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/wdBsSeArdWY/hqdefault.jpg', 'youtube', 'wdBsSeArdWY', 'https://www.youtube.com/watch?v=wdBsSeArdWY', 'https://www.youtube.com/watch?v=wdBsSeArdWY', 'Music Nepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1162, 'Tiharai Aayo Lau Jhilimili (Bhailini Aaye Aangan)', '', 'Tiharai Aayo Lau Jhilimili (Bhailini Aaye Aangan)', 120, '', '', '', '', '', 2019, 'Nepali', 10, '["festive", "tihar", "bhailo"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/QTWdyooS18s/hqdefault.jpg', 'youtube', 'QTWdyooS18s', 'https://www.youtube.com/watch?v=QTWdyooS18s', 'https://www.youtube.com/watch?v=QTWdyooS18s', 'HighlightsNepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1163, 'Deusi Bhailo (Pashupati Sharma)', '', 'Deusi Bhailo (Pashupati Sharma)', 121, '', '', '', '', '', 2022, 'Nepali', 10, '["festive", "tihar", "deusi", "bhailo"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/TEpW9MJlGPs/hqdefault.jpg', 'youtube', 'TEpW9MJlGPs', 'https://www.youtube.com/watch?v=TEpW9MJlGPs', 'https://www.youtube.com/watch?v=TEpW9MJlGPs', 'Good Luck Nepal', 'verified', 'published', 4158, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1164, 'Tiharaima Deusi Geet Gayera', '', 'Tiharaima Deusi Geet Gayera', 122, '', '', '', '', '', 2021, 'Nepali', 10, '["festive", "tihar", "deusi"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/f9XtnNA8E18/hqdefault.jpg', 'youtube', 'f9XtnNA8E18', 'https://www.youtube.com/watch?v=f9XtnNA8E18', 'https://www.youtube.com/watch?v=f9XtnNA8E18', 'LAXMA', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1165, 'Maita Bata', '', 'Maita Bata', 65, '', '', '', '', '', 2019, 'Nepali', 10, '["festive", "teej", "maita", "emotional", "heart-touching"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/nsakkyL9454/hqdefault.jpg', 'youtube', 'nsakkyL9454', 'https://www.youtube.com/watch?v=nsakkyL9454', 'https://www.youtube.com/watch?v=nsakkyL9454', 'Music Nepal', 'verified', 'published', 8168, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1166, 'Teej Ko Ranko', '', 'Teej Ko Ranko', 123, '', '', '', '', '', 2019, 'Nepali', 10, '["festive", "teej", "folk"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/64CJ9QDjpkU/hqdefault.jpg', 'youtube', '64CJ9QDjpkU', 'https://www.youtube.com/watch?v=64CJ9QDjpkU', 'https://www.youtube.com/watch?v=64CJ9QDjpkU', 'Kali Prasad Baskota', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1167, 'Naya Barsha Ko Shubhakamana', '', 'Naya Barsha Ko Shubhakamana', 124, '', '', '', '', '', 2021, 'Nepali', 10, '["festive", "newyear", "chitrabhan", "hope"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/LDF1boLovBw/hqdefault.jpg', 'youtube', 'LDF1boLovBw', 'https://www.youtube.com/watch?v=LDF1boLovBw', 'https://www.youtube.com/watch?v=LDF1boLovBw', 'Janmabhoomi Online', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1168, 'Subhakamna Naya Barsha Naya Jiwan Lai', '', 'Subhakamna Naya Barsha Naya Jiwan Lai', 125, '', '', '', '', '', 2019, 'Nepali', 10, '["festive", "newyear", "chitrabhan"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/s1eUcdpdZHI/hqdefault.jpg', 'youtube', 's1eUcdpdZHI', 'https://www.youtube.com/watch?v=s1eUcdpdZHI', 'https://www.youtube.com/watch?v=s1eUcdpdZHI', 'Prakash Shrestha', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1169, 'Lhochhar Mela (Selo)', '', 'Lhochhar Mela (Selo)', 126, '', '', '', '', '', 2022, 'Nepali', 11, '["festive", "sonam-lhosar", "tamang", "newyear"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/R4e0rT49qdo/hqdefault.jpg', 'youtube', 'R4e0rT49qdo', 'https://www.youtube.com/watch?v=R4e0rT49qdo', 'https://www.youtube.com/watch?v=R4e0rT49qdo', 'LMC Digital Media', 'verified', 'published', 4301, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1170, 'Sonam Lhochhar', '', 'Sonam Lhochhar', 127, '', '', '', '', '', 2021, 'Nepali', 11, '["festive", "sonam-lhosar", "tamang", "newyear"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/8GEed5LbF_Y/hqdefault.jpg', 'youtube', '8GEed5LbF_Y', 'https://www.youtube.com/watch?v=8GEed5LbF_Y', 'https://www.youtube.com/watch?v=8GEed5LbF_Y', 'LMC Digital Media', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1171, 'Sansari Maya Bichitra', '', 'Sansari Maya Bichitra', 128, '', '', '', '', '', 1998, 'Nepali', 13, '["festive", "buddha-jayanti", "devotional", "peaceful"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/9eY93xAilfw/hqdefault.jpg', 'youtube', '9eY93xAilfw', 'https://www.youtube.com/watch?v=9eY93xAilfw', 'https://www.youtube.com/watch?v=9eY93xAilfw', 'HighlightsNepal', 'verified', 'published', 32496, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1172, 'Shiv Vivah Bhajan', '', 'Shiv Vivah Bhajan', 129, '', '', '', '', '', 2022, 'Nepali', 13, '["festive", "maha-shivaratri", "bhajan", "devotional"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/92h5AiND9Io/hqdefault.jpg', 'youtube', '92h5AiND9Io', 'https://www.youtube.com/watch?v=92h5AiND9Io', 'https://www.youtube.com/watch?v=92h5AiND9Io', 'Raju Adhikari Offical', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1173, 'Jhyappai Aaye Mahadev Trishul Bokera', '', 'Jhyappai Aaye Mahadev Trishul Bokera', 130, '', '', '', '', '', 2021, 'Nepali', 13, '["festive", "maha-shivaratri", "bhajan", "devotional"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/JBIk5YIyW2k/hqdefault.jpg', 'youtube', 'JBIk5YIyW2k', 'https://www.youtube.com/watch?v=JBIk5YIyW2k', 'https://www.youtube.com/watch?v=JBIk5YIyW2k', 'Samjhana official', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1174, 'Uga Hai Suraj Dev', '', 'Uga Hai Suraj Dev', 131, '', '', '', '', '', 2005, 'Hindi', 13, '["festive", "chhath", "devotional", "sun"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/6e6Hp6R5SVU/hqdefault.jpg', 'youtube', '6e6Hp6R5SVU', 'https://www.youtube.com/watch?v=6e6Hp6R5SVU', 'https://www.youtube.com/watch?v=6e6Hp6R5SVU', 'T-Series Bhakti Sagar', 'verified', 'published', 48000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1175, 'Jode Jode Phalwa', '', 'Jode Jode Phalwa', 132, '', '', '', '', '', 2020, 'Hindi', 13, '["festive", "chhath", "devotional", "sun"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/BKoD7bTLc2k/hqdefault.jpg', 'youtube', 'BKoD7bTLc2k', 'https://www.youtube.com/watch?v=BKoD7bTLc2k', 'https://www.youtube.com/watch?v=BKoD7bTLc2k', 'T-Series Hamaar Bhojpuri', 'verified', 'published', 48000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1176, 'Anjuli Bhari Jal Li', '', 'Anjuli Bhari Jal Li', 133, '', '', '', '', '', 2000, 'Maithili', 13, '["festive", "chhath", "devotional", "traditional"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/4tpwgstNaiU/hqdefault.jpg', 'youtube', '4tpwgstNaiU', 'https://www.youtube.com/watch?v=4tpwgstNaiU', 'https://www.youtube.com/watch?v=4tpwgstNaiU', 'Maithili Online', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1177, 'Maiya Lagal Sali (Maghi)', '', 'Maiya Lagal Sali (Maghi)', 134, '', '', '', '', '', 2019, 'Nepali', 3, '["festive", "maghe", "harvest", "folk"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/EQUmwKMUxvk/hqdefault.jpg', 'youtube', 'EQUmwKMUxvk', 'https://www.youtube.com/watch?v=EQUmwKMUxvk', 'https://www.youtube.com/watch?v=EQUmwKMUxvk', 'Manbi Media', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1178, 'Maghe Sakranti', '', 'Maghe Sakranti', 135, '', '', '', '', '', 2018, 'Nepali', 3, '["festive", "maghe", "harvest"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/sMwPILpnZ0Q/hqdefault.jpg', 'youtube', 'sMwPILpnZ0Q', 'https://www.youtube.com/watch?v=sMwPILpnZ0Q', 'https://www.youtube.com/watch?v=sMwPILpnZ0Q', 'Chandra Jyoti Ale', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1179, 'Holi', '', 'Holi', 136, '', '', '', '', '', 2020, 'Nepali', 10, '["festive", "holi", "dance"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/Op7akBsXqFc/hqdefault.jpg', 'youtube', 'Op7akBsXqFc', 'https://www.youtube.com/watch?v=Op7akBsXqFc', 'https://www.youtube.com/watch?v=Op7akBsXqFc', 'Ramesh Raj Bhattarai', 'verified', 'published', 4315, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1180, 'Dui Aankha Chaar Bho (Phagu)', '', 'Dui Aankha Chaar Bho (Phagu)', 61, '', '', '', '', '', 1995, 'Nepali', 4, '["festive", "holi", "folk", "classic"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/lMvk9zCZ03U/hqdefault.jpg', 'youtube', 'lMvk9zCZ03U', 'https://www.youtube.com/watch?v=lMvk9zCZ03U', 'https://www.youtube.com/watch?v=lMvk9zCZ03U', 'Budha Subba Digital', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1181, 'Bhetaula Ni Ram', '', 'Bhetaula Ni Ram', 137, '', '', '', '', '', 2020, 'Nepali', 13, '["festive", "ram-navami", "ram", "bhajan", "devotional"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/_WqosytNkwY/hqdefault.jpg', 'youtube', '_WqosytNkwY', 'https://www.youtube.com/watch?v=_WqosytNkwY', 'https://www.youtube.com/watch?v=_WqosytNkwY', 'SK Music Vibes', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1182, 'Ram Bhuliyo', '', 'Ram Bhuliyo', 138, '', '', '', '', '', 2021, 'Nepali', 13, '["festive", "ram-navami", "ram", "bhajan"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/cOpJZU0Se24/hqdefault.jpg', 'youtube', 'cOpJZU0Se24', 'https://www.youtube.com/watch?v=cOpJZU0Se24', 'https://www.youtube.com/watch?v=cOpJZU0Se24', 'Diwas Gautam', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1183, 'Janai Purnima Geet 2083', '', 'Janai Purnima Geet 2083', 139, '', '', '', '', '', 2021, 'Nepali', 3, '["festive", "janai-purnima", "purnima"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/E9uZBnTmBXI/hqdefault.jpg', 'youtube', 'E9uZBnTmBXI', 'https://www.youtube.com/watch?v=E9uZBnTmBXI', 'https://www.youtube.com/watch?v=E9uZBnTmBXI', 'Raha', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1184, 'Rakshabandhan', '', 'Rakshabandhan', 140, '', '', '', '', '', 2021, 'Nepali', 3, '["festive", "janai-purnima", "rakhi", "emotional"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/2i--yfY67SE/hqdefault.jpg', 'youtube', '2i--yfY67SE', 'https://www.youtube.com/watch?v=2i--yfY67SE', 'https://www.youtube.com/watch?v=2i--yfY67SE', 'Sannu Kumar', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1185, 'Gokulama Krishna Ji', '', 'Gokulama Krishna Ji', 141, '', '', '', '', '', 2022, 'Nepali', 13, '["festive", "krishna-janmashtami", "krishna", "bhajan", "devotional"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/5G5gzkiM_Ro/hqdefault.jpg', 'youtube', '5G5gzkiM_Ro', 'https://www.youtube.com/watch?v=5G5gzkiM_Ro', 'https://www.youtube.com/watch?v=5G5gzkiM_Ro', 'Nepali Tunes', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1186, 'Hey Krishna Malai Mitho Bamsi', '', 'Hey Krishna Malai Mitho Bamsi', 129, '', '', '', '', '', 2021, 'Nepali', 13, '["festive", "krishna-janmashtami", "krishna", "bhajan"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/3TDwgMJlR8o/hqdefault.jpg', 'youtube', '3TDwgMJlR8o', 'https://www.youtube.com/watch?v=3TDwgMJlR8o', 'https://www.youtube.com/watch?v=3TDwgMJlR8o', 'SRD BHAKTi', 'verified', 'published', 4909, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1187, 'Aaigaila Gaura Parva', '', 'Aaigaila Gaura Parva', 142, '', '', '', '', '', 2019, 'Nepali', 3, '["festive", "gaura", "deuda", "folk"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/RbdjN4RA7uU/hqdefault.jpg', 'youtube', 'RbdjN4RA7uU', 'https://www.youtube.com/watch?v=RbdjN4RA7uU', 'https://www.youtube.com/watch?v=RbdjN4RA7uU', 'Jayraj Bhatta', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1188, 'Isharale Bola (Deuda)', '', 'Isharale Bola (Deuda)', 143, '', '', '', '', '', 2019, 'Nepali', 3, '["festive", "gaura", "deuda", "folk"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/nM2Mmuud-nY/hqdefault.jpg', 'youtube', 'nM2Mmuud-nY', 'https://www.youtube.com/watch?v=nM2Mmuud-nY', 'https://www.youtube.com/watch?v=nM2Mmuud-nY', 'DR Chautari', 'verified', 'published', 12945, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1189, 'Tahamachaa Gana Tay', '', 'Tahamachaa Gana Tay', 144, '', '', '', '', '', 2019, 'Newari', 12, '["festive", "gai-jatra", "newari", "community"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/DI2y5DPRrIQ/hqdefault.jpg', 'youtube', 'DI2y5DPRrIQ', 'https://www.youtube.com/watch?v=DI2y5DPRrIQ', 'https://www.youtube.com/watch?v=DI2y5DPRrIQ', 'Khwopa Media Circle( ख्वप मिडिया सर्कल )', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1190, 'Bhaleko Gaijatra', '', 'Bhaleko Gaijatra', 145, '', '', '', '', '', 2019, 'Nepali', 3, '["festive", "gai-jatra", "folk"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/WAoz4pZYyIo/hqdefault.jpg', 'youtube', 'WAoz4pZYyIo', 'https://www.youtube.com/watch?v=WAoz4pZYyIo', 'https://www.youtube.com/watch?v=WAoz4pZYyIo', 'Nawa Raj  Kapri Dhadinge Bhale', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1191, 'Yenya Punhi (Indrajatra)', '', 'Yenya Punhi (Indrajatra)', 146, '', '', '', '', '', 2021, 'Newari', 12, '["festive", "indra-jatra", "newari", "jatra"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/QBBVT43PAi8/hqdefault.jpg', 'youtube', 'QBBVT43PAi8', 'https://www.youtube.com/watch?v=QBBVT43PAi8', 'https://www.youtube.com/watch?v=QBBVT43PAi8', 'Mitesh Tamrakar', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1192, 'Indra Jatra (Heartbeat of Kathmandu)', '', 'Indra Jatra (Heartbeat of Kathmandu)', 147, '', '', '', '', '', 2022, 'Newari', 12, '["festive", "indra-jatra", "newari", "jatra"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/gw4120N1i7I/hqdefault.jpg', 'youtube', 'gw4120N1i7I', 'https://www.youtube.com/watch?v=gw4120N1i7I', 'https://www.youtube.com/watch?v=gw4120N1i7I', 'Mertz Creation', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1193, 'Biska Nakha (Tokha Bisket Jatra)', '', 'Biska Nakha (Tokha Bisket Jatra)', 148, '', '', '', '', '', 2018, 'Newari', 12, '["festive", "bisket-jatra", "newari", "jatra"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/_vmqEP_pL6c/hqdefault.jpg', 'youtube', '_vmqEP_pL6c', 'https://www.youtube.com/watch?v=_vmqEP_pL6c', 'https://www.youtube.com/watch?v=_vmqEP_pL6c', 'Vajra Tunes', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1194, 'Biska Jatra 2074', '', 'Biska Jatra 2074', 149, '', '', '', '', '', 2018, 'Newari', 12, '["festive", "bisket-jatra", "newari"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/o4SZWA-NuYI/hqdefault.jpg', 'youtube', 'o4SZWA-NuYI', 'https://www.youtube.com/watch?v=o4SZWA-NuYI', 'https://www.youtube.com/watch?v=o4SZWA-NuYI', 'Anish Jo C', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1195, 'Ramailo Hamro Tamu Lhosar', '', 'Ramailo Hamro Tamu Lhosar', 150, '', '', '', '', '', 2019, 'Nepali', 11, '["festive", "tamu-lhosar", "tamang", "newyear"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/y4Vuk1A7FU8/hqdefault.jpg', 'youtube', 'y4Vuk1A7FU8', 'https://www.youtube.com/watch?v=y4Vuk1A7FU8', 'https://www.youtube.com/watch?v=y4Vuk1A7FU8', 'Rodhi Music', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1196, 'New Lhosar Song', '', 'New Lhosar Song', 151, '', '', '', '', '', 2023, 'Nepali', 11, '["festive", "tamu-lhosar", "tamang", "newyear"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/gmZi5K_WaKo/hqdefault.jpg', 'youtube', 'gmZi5K_WaKo', 'https://www.youtube.com/watch?v=gmZi5K_WaKo', 'https://www.youtube.com/watch?v=gmZi5K_WaKo', 'Dip Gurung', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1197, 'Kho Lhosar Kho', '', 'Kho Lhosar Kho', 152, '', '', '', '', '', 2019, 'Nepali', 11, '["festive", "tamu-lhosar", "tamang", "newyear"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/vHJpZmhaWB0/hqdefault.jpg', 'youtube', 'vHJpZmhaWB0', 'https://www.youtube.com/watch?v=vHJpZmhaWB0', 'https://www.youtube.com/watch?v=vHJpZmhaWB0', 'Global Nepal Entertainment', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1198, 'New Tibetan Losar Song 2021', '', 'New Tibetan Losar Song 2021', 153, '', '', '', '', '', 2021, 'Tibetan', 10, '["festive", "gyalpo-lhosar", "losar", "buddhist"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/KXNyzW_jQ0c/hqdefault.jpg', 'youtube', 'KXNyzW_jQ0c', 'https://www.youtube.com/watch?v=KXNyzW_jQ0c', 'https://www.youtube.com/watch?v=KXNyzW_jQ0c', 'Sonam Londen', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1199, 'Lho Samba Lesung', '', 'Lho Samba Lesung', 154, '', '', '', '', '', 2021, 'Sherpa', 10, '["festive", "gyalpo-lhosar", "losar", "sherpa"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/vxpaiOX_tT8/hqdefault.jpg', 'youtube', 'vxpaiOX_tT8', 'https://www.youtube.com/watch?v=vxpaiOX_tT8', 'https://www.youtube.com/watch?v=vxpaiOX_tT8', 'Yaks Films Production', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1200, 'Yomari Song (Newari Traditional)', '', 'Yomari Song (Newari Traditional)', 155, '', '', '', '', '', 2017, 'Newari', 12, '["festive", "yomari-punhi", "newari", "harvest"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/-4hmhNIwbRc/hqdefault.jpg', 'youtube', '-4hmhNIwbRc', 'https://www.youtube.com/watch?v=-4hmhNIwbRc', 'https://www.youtube.com/watch?v=-4hmhNIwbRc', 'Avinash Dangol', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1201, 'Yamari', '', 'Yamari', 120, '', '', '', '', '', 2017, 'Newari', 12, '["festive", "yomari-punhi", "newari"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/h__G7mCcPs0/hqdefault.jpg', 'youtube', 'h__G7mCcPs0', 'https://www.youtube.com/watch?v=h__G7mCcPs0', 'https://www.youtube.com/watch?v=h__G7mCcPs0', 'HighlightsNepal', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1202, 'Bethlehem Gaawaima', '', 'Bethlehem Gaawaima', 56, '', '', '', '', '', 2022, 'Nepali', 13, '["festive", "christmas", "devotional", "peaceful"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/bUBO4428oQ4/hqdefault.jpg', 'youtube', 'bUBO4428oQ4', 'https://www.youtube.com/watch?v=bUBO4428oQ4', 'https://www.youtube.com/watch?v=bUBO4428oQ4', 'Adrian Dewan Official', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1203, 'Christmas Ko Din Aayo', '', 'Christmas Ko Din Aayo', 156, '', '', '', '', '', 2021, 'Nepali', 13, '["festive", "christmas", "devotional"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/ls81lVowLd8/hqdefault.jpg', 'youtube', 'ls81lVowLd8', 'https://www.youtube.com/watch?v=ls81lVowLd8', 'https://www.youtube.com/watch?v=ls81lVowLd8', 'RAZ RAI OFFICIAL', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1204, 'Happy Christmas', '', 'Happy Christmas', 56, '', '', '', '', '', 2020, 'Nepali', 13, '["festive", "christmas", "devotional", "peaceful"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/yOGrHxSYiEQ/hqdefault.jpg', 'youtube', 'yOGrHxSYiEQ', 'https://www.youtube.com/watch?v=yOGrHxSYiEQ', 'https://www.youtube.com/watch?v=yOGrHxSYiEQ', 'Adrian Dewan Official', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1205, 'Eid Mubarak (Nasheed)', '', 'Eid Mubarak (Nasheed)', 157, '', '', '', '', '', 2022, 'Urdu', 13, '["festive", "eid", "devotional", "peaceful"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/0ap9lQcM6XQ/hqdefault.jpg', 'youtube', '0ap9lQcM6XQ', 'https://www.youtube.com/watch?v=0ap9lQcM6XQ', 'https://www.youtube.com/watch?v=0ap9lQcM6XQ', 'Heera Gold', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1206, 'Taan Bunne Tayama Khiyama (Sakela Sili)', '', 'Taan Bunne Tayama Khiyama (Sakela Sili)', 158, '', '', '', '', '', 2019, 'Nepali', 3, '["festive", "udhauli-ubhauli", "sakela", "kirat", "dance"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/xrGKGe3QCgY/hqdefault.jpg', 'youtube', 'xrGKGe3QCgY', 'https://www.youtube.com/watch?v=xrGKGe3QCgY', 'https://www.youtube.com/watch?v=xrGKGe3QCgY', 'Nikesh Rai', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1207, 'Sumnima Ra Paruhang', '', 'Sumnima Ra Paruhang', 159, '', '', '', '', '', 2019, 'Nepali', 3, '["festive", "udhauli-ubhauli", "sakela", "kirat"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/BdNqygXjkQA/hqdefault.jpg', 'youtube', 'BdNqygXjkQA', 'https://www.youtube.com/watch?v=BdNqygXjkQA', 'https://www.youtube.com/watch?v=BdNqygXjkQA', 'Budha Subba Digital', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000');
select setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));

update public.songs
set festival_id = c.id
from (values
    (1159, 1),
    (1160, 1),
    (1161, 1),
    (1162, 2),
    (1163, 2),
    (1164, 2),
    (1165, 3),
    (1166, 3),
    (1167, 4),
    (1168, 4),
    (1169, 5),
    (1170, 5),
    (1171, 6),
    (1172, 7),
    (1173, 7),
    (1174, 8),
    (1175, 8),
    (1176, 8),
    (1177, 9),
    (1178, 9),
    (1179, 10),
    (1180, 10),
    (1181, 11),
    (1182, 11),
    (1183, 12),
    (1184, 12),
    (1185, 13),
    (1186, 13),
    (1187, 14),
    (1188, 14),
    (1189, 15),
    (1190, 15),
    (1191, 16),
    (1192, 16),
    (1193, 17),
    (1194, 17),
    (1195, 18),
    (1196, 18),
    (1197, 18),
    (1198, 19),
    (1199, 19),
    (1200, 20),
    (1201, 20),
    (1202, 21),
    (1203, 21),
    (1204, 21),
    (1205, 22),
    (1206, 23),
    (1207, 23)
) as mapping(song_id, festival_id)
join public.festival_categories c on c.id = mapping.festival_id
where public.songs.id = mapping.song_id;


-- More famous Dashain / Tihar / Chhath songs.
insert into public.artists (id, display_name, display_name_ne, biography, biography_ne, profile_image, verification_status, created_at, updated_at) values
    (160, 'Armed Police Force Nepal', '', 'Armed Police Force Nepal — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (161, 'Bhawana Music Solution', '', 'Bhawana Music Solution — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (162, 'Dharma Darshan Bhajan', '', 'Dharma Darshan Bhajan — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (163, 'Swati Mishra', '', 'Swati Mishra — festival artist featured on Bajeko Chiya Pasal.', '', '', 'verified', '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000');
select setval(pg_get_serial_sequence('public.artists', 'id'), (select max(id) from public.artists));

insert into public.songs (id, title, title_ne, romanized_title, artist_id, featured_artists, composer, lyricist, album, film_or_source, release_year, language, primary_genre_id, mood_tags, decade, duration_seconds, artwork_url, playback_provider, provider_video_id, provider_url, source_url, attribution, metadata_verification_status, publication_status, play_count, is_featured, featured_order, created_at, updated_at) values
    (1208, 'Dashain Dikpal', '', 'Dashain Dikpal', 118, '', '', '', '', '', 1998, 'Nepali', 10, '["festive", "dashain", "classic", "popular"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/hsLsa1pYfxg/hqdefault.jpg', 'youtube', 'hsLsa1pYfxg', 'https://www.youtube.com/watch?v=hsLsa1pYfxg', 'https://www.youtube.com/watch?v=hsLsa1pYfxg', 'HiTechEntertainment', 'verified', 'published', 14534, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1209, 'Faujilai Kun Ho Dashain Kun Ho Chad Tihar', '', 'Faujilai Kun Ho Dashain Kun Ho Chad Tihar', 160, '', '', '', '', '', 2020, 'Nepali', 10, '["festive", "dashain", "popular"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/92NmMcS1w0o/hqdefault.jpg', 'youtube', '92NmMcS1w0o', 'https://www.youtube.com/watch?v=92NmMcS1w0o', 'https://www.youtube.com/watch?v=92NmMcS1w0o', 'Armed Police Force Nepal, (Samarpan Rastraka Lagi)', 'verified', 'published', 5952, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1210, 'Rato Tika Siraima Jamara', '', 'Rato Tika Siraima Jamara', 161, '', '', '', '', '', 2022, 'Nepali', 10, '["festive", "dashain", "traditional"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/B77Tmsx-Ckg/hqdefault.jpg', 'youtube', 'B77Tmsx-Ckg', 'https://www.youtube.com/watch?v=B77Tmsx-Ckg', 'https://www.youtube.com/watch?v=B77Tmsx-Ckg', 'Bhawana Music Solution', 'verified', 'published', 9823, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1211, 'Bhaileni Aye Aagana', '', 'Bhaileni Aye Aagana', 120, '', '', '', '', '', 1995, 'Nepali', 10, '["festive", "tihar", "bhailo", "classic"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/gPYRNCHsl6M/hqdefault.jpg', 'youtube', 'gPYRNCHsl6M', 'https://www.youtube.com/watch?v=gPYRNCHsl6M', 'https://www.youtube.com/watch?v=gPYRNCHsl6M', 'HighlightsNepal', 'verified', 'published', 6645, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1212, 'Saptarangi Tika', '', 'Saptarangi Tika', 66, '', '', '', '', '', 2019, 'Nepali', 10, '["festive", "tihar", "deusi", "bhailo"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/eZwQsUkPyPU/hqdefault.jpg', 'youtube', 'eZwQsUkPyPU', 'https://www.youtube.com/watch?v=eZwQsUkPyPU', 'https://www.youtube.com/watch?v=eZwQsUkPyPU', 'Jigme Media', 'verified', 'published', 6398, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1213, 'Nidharama Larkayera Saptarangi Tiko', '', 'Nidharama Larkayera Saptarangi Tiko', 118, '', '', '', '', '', 2000, 'Nepali', 10, '["festive", "tihar", "classic"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/K_5sVddaXh4/hqdefault.jpg', 'youtube', 'K_5sVddaXh4', 'https://www.youtube.com/watch?v=K_5sVddaXh4', 'https://www.youtube.com/watch?v=K_5sVddaXh4', 'HiTechEntertainment', 'verified', 'published', 4220, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1214, 'Om Jai Laxmi Mata (Nepali Laxmi Aarati)', '', 'Om Jai Laxmi Mata (Nepali Laxmi Aarati)', 162, '', '', '', '', '', 2018, 'Nepali', 13, '["festive", "tihar", "devotional", "bhajan", "aarti"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/j0V58Gs2Fqc/hqdefault.jpg', 'youtube', 'j0V58Gs2Fqc', 'https://www.youtube.com/watch?v=j0V58Gs2Fqc', 'https://www.youtube.com/watch?v=j0V58Gs2Fqc', 'Dharma Darshan Bhajan', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1215, 'Adharma Aaj Unkai Chha Geet (Bahilo Geet)', '', 'Adharma Aaj Unkai Chha Geet (Bahilo Geet)', 118, '', '', '', '', '', 1998, 'Nepali', 10, '["festive", "tihar", "bhailo", "classic"]'::jsonb, '1990s', NULL, 'https://img.youtube.com/vi/5lrYa2ThysY/hqdefault.jpg', 'youtube', '5lrYa2ThysY', 'https://www.youtube.com/watch?v=5lrYa2ThysY', 'https://www.youtube.com/watch?v=5lrYa2ThysY', 'HiTechEntertainment', 'verified', 'published', 3000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1216, 'Kaanch Hi Baans Ke Bahangiya', '', 'Kaanch Hi Baans Ke Bahangiya', 131, '', '', '', '', '', 2005, 'Hindi', 13, '["festive", "chhath", "devotional", "sun", "classic"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/Eyq7vfxu4iA/hqdefault.jpg', 'youtube', 'Eyq7vfxu4iA', 'https://www.youtube.com/watch?v=Eyq7vfxu4iA', 'https://www.youtube.com/watch?v=Eyq7vfxu4iA', 'T-Series Bhakti Sagar', 'verified', 'published', 48000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1217, 'Kelwa Ke Paat Par', '', 'Kelwa Ke Paat Par', 36, '', '', '', '', '', 2006, 'Hindi', 13, '["festive", "chhath", "devotional", "sun", "classic"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/knZ8b5YnQiY/hqdefault.jpg', 'youtube', 'knZ8b5YnQiY', 'https://www.youtube.com/watch?v=knZ8b5YnQiY', 'https://www.youtube.com/watch?v=knZ8b5YnQiY', 'T-Series Bhakti Sagar', 'verified', 'published', 48000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1218, 'Pahile Pahil Chhathi Maiya', '', 'Pahile Pahil Chhathi Maiya', 36, '', '', '', '', '', 2010, 'Hindi', 13, '["festive", "chhath", "devotional", "sun", "classic"]'::jsonb, '2010s', NULL, 'https://img.youtube.com/vi/DG8F-csoRAQ/hqdefault.jpg', 'youtube', 'DG8F-csoRAQ', 'https://www.youtube.com/watch?v=DG8F-csoRAQ', 'https://www.youtube.com/watch?v=DG8F-csoRAQ', 'Worldwide Records Bhojpuri', 'verified', 'published', 48000, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1219, 'Baanjhi Kewdwa Dhaile Thaadh', '', 'Baanjhi Kewdwa Dhaile Thaadh', 36, '', '', '', '', '', 2008, 'Hindi', 13, '["festive", "chhath", "devotional", "sun"]'::jsonb, '2000s', NULL, 'https://img.youtube.com/vi/MEnyozGodAU/hqdefault.jpg', 'youtube', 'MEnyozGodAU', 'https://www.youtube.com/watch?v=MEnyozGodAU', 'https://www.youtube.com/watch?v=MEnyozGodAU', 'T-Series Bhakti Sagar', 'verified', 'published', 29170, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000'),
    (1220, 'Nimiya Ke Dadh Maiya', '', 'Nimiya Ke Dadh Maiya', 163, '', '', '', '', '', 2022, 'Hindi', 13, '["festive", "chhath", "devotional", "sun"]'::jsonb, '2020s', NULL, 'https://img.youtube.com/vi/MJ4Sn-_Mkk0/hqdefault.jpg', 'youtube', 'MJ4Sn-_Mkk0', 'https://www.youtube.com/watch?v=MJ4Sn-_Mkk0', 'https://www.youtube.com/watch?v=MJ4Sn-_Mkk0', 'Swati Mishra Bhakti', 'verified', 'published', 22946, false, 0, '2026-10-17T12:00:00.000000', '2026-10-17T12:00:00.000000');
select setval(pg_get_serial_sequence('public.songs', 'id'), (select max(id) from public.songs));

update public.songs
set festival_id = c.id
from (values
    (1208, 1),
    (1209, 1),
    (1210, 1),
    (1211, 2),
    (1212, 2),
    (1213, 2),
    (1214, 2),
    (1215, 2),
    (1216, 8),
    (1217, 8),
    (1218, 8),
    (1219, 8),
    (1220, 8)
) as mapping(song_id, festival_id)
join public.festival_categories c on c.id = mapping.festival_id
where public.songs.id = mapping.song_id;
-- =====================================================
-- Bajeko Chiya Pasal — curated tea-shop playlist
-- Copied from supabase/migrations/0010_chiya_pasal_playlist.sql.
-- Keep the two blocks in sync: the migration upgrades existing databases,
-- this copy installs the playlist on a fresh seed.
-- =====================================================

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
