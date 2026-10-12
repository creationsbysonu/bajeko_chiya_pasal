import json
import re

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from radio_core.models import (
    Artist, Genre, GenreCategory, Song, Station, StationSong,
    Favorite, TakedownRequest, AuditLog, PlaybackEvent
)

User = get_user_model()


def _solve_captcha(client):
    """Fetch a captcha challenge and return (token, answer) for login requests."""
    res = client.get('/api/auth/captcha/')
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    # Question format: "A + B = ?"
    match = re.search(r'(\d+)\s*\+\s*(\d+)', data['question'])
    assert match, f"Unexpected captcha question format: {data['question']}"
    answer = str(int(match.group(1)) + int(match.group(2)))
    return data['token'], answer


class MusicCatalogAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.artist = Artist.objects.create(
            display_name="Narayan Gopal",
            display_name_ne="नारायण गोपाल",
            biography="Swor Samrat of Nepal"
        )
        self.genre = Genre.objects.create(
            name="Adhunik Geet",
            name_ne="आधुनिक गीत",
            slug="adhunik-geet",
            category="popular"
        )
        self.song1 = Song.objects.create(
            title="Kehi Mitho Baat Gara",
            title_ne="केही मीठो बात गर",
            romanized_title="Kehi Mitho Baat Gara",
            artist=self.artist,
            primary_genre=self.genre,
            release_year=1980,
            decade="1980s",
            language="Nepali",
            provider_video_id="8Gq51d6aN5c",
            metadata_verification_status="verified",
            publication_status="published"
        )
        self.song2 = Song.objects.create(
            title="Mohani Lagla Hai",
            title_ne="मोहनी लाग्ला है",
            romanized_title="Mohani Lagla Hai Gauleko",
            artist=self.artist,
            primary_genre=self.genre,
            release_year=1991,
            decade="1990s",
            language="Nepali",
            provider_video_id="h-T65sT66xQ",
            metadata_verification_status="verified",
            publication_status="published"
        )
        self.station = Station.objects.create(
            slug="purano-radio",
            title="Purano Radio",
            title_ne="पुरानो रेडियो",
            theme_color="#C7A66A"
        )
        StationSong.objects.create(station=self.station, song=self.song1, position=0)
        StationSong.objects.create(station=self.station, song=self.song2, position=1)

        # Admin user
        self.admin_user = User.objects.create_superuser(
            username="testadmin",
            email="admin@test.com",
            password="adminpassword123"
        )

    def test_api_root(self):
        response = self.client.get('/api/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['status'], 'healthy')

    def test_stations_list(self):
        response = self.client.get('/api/stations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertGreaterEqual(len(data), 1)
        self.assertEqual(data[0]['slug'], 'purano-radio')
        self.assertEqual(data[0]['songs_count'], 2)

    def test_station_detail_ordered_queue(self):
        response = self.client.get('/api/stations/purano-radio/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['title'], 'Purano Radio')
        songs = data['station_songs']
        self.assertEqual(len(songs), 2)
        self.assertEqual(songs[0]['song']['title'], 'Kehi Mitho Baat Gara')
        self.assertEqual(songs[1]['song']['title'], 'Mohani Lagla Hai')

    def test_song_search_romanized(self):
        response = self.client.get('/api/songs/?search=Mitho')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json()['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title'], 'Kehi Mitho Baat Gara')

    def test_song_search_devanagari_unicode(self):
        response = self.client.get('/api/songs/?search=मोहनी')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json()['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['title_ne'], 'मोहनी लाग्ला है')

    def test_song_filter_by_decade(self):
        response = self.client.get('/api/songs/?decade=1980s')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json()['results']
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['release_year'], 1980)

    def test_languages_list(self):
        response = self.client.get('/api/languages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['language'], 'Nepali')
        self.assertEqual(data[0]['count'], 2)

    def test_favorite_anonymous_guest(self):
        session_key = "guest_browser_session_123"
        # Add favorite
        response = self.client.post(
            '/api/favorites/',
            {'song_id': self.song1.id},
            HTTP_X_SESSION_KEY=session_key
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Get favorites
        get_res = self.client.get('/api/favorites/', HTTP_X_SESSION_KEY=session_key)
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.json()), 1)

        # Delete favorite
        del_res = self.client.delete(f'/api/favorites/?song_id={self.song1.id}', HTTP_X_SESSION_KEY=session_key)
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

    def test_playback_event_increments_count(self):
        initial_plays = self.song1.play_count
        response = self.client.post('/api/playback-events/', {
            'event_type': 'complete',
            'song': self.song1.id,
            'station': self.station.id,
            'session_id': 'anon_123'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.song1.refresh_from_db()
        self.assertEqual(self.song1.play_count, initial_plays + 1)

    def test_takedown_submission_and_audit_log(self):
        response = self.client.post('/api/takedown-request/', {
            'song': self.song1.id,
            'claimant_name': 'Original Producer',
            'claimant_email': 'rights@holder.com',
            'reason': 'copyright',
            'details': 'Please review embed settings.'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        ticket_id = response.json()['ticket_id']
        self.assertTrue(TakedownRequest.objects.filter(id=ticket_id).exists())
        self.assertTrue(AuditLog.objects.filter(action='TAKEDOWN_SUBMITTED').exists())

    def test_admin_permissions_enforced(self):
        # Anonymous user cannot access admin stats
        anon_res = self.client.get('/api/admin/stats/')
        self.assertEqual(anon_res.status_code, status.HTTP_403_FORBIDDEN)

        # Admin user can access
        self.client.force_authenticate(user=self.admin_user)
        admin_res = self.client.get('/api/admin/stats/')
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)
        self.assertEqual(admin_res.json()['total_songs'], 2)

    def test_admin_auth_login_and_profile(self):
        csrf_res = self.client.get('/api/auth/csrf/')
        self.assertEqual(csrf_res.status_code, status.HTTP_200_OK)

        captcha_token, captcha_answer = _solve_captcha(self.client)
        login_res = self.client.post('/api/auth/login/', {
            'username': 'testadmin',
            'password': 'adminpassword123',
            'captcha_token': captcha_token,
            'captcha_answer': captcha_answer,
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertTrue(login_res.json()['authenticated'])
        self.assertTrue(login_res.json()['is_staff'])

        user_res = self.client.get('/api/auth/user/')
        self.assertEqual(user_res.status_code, status.HTTP_200_OK)
        self.assertTrue(user_res.json()['authenticated'])
        self.assertEqual(user_res.json()['username'], 'testadmin')

    def test_admin_password_change(self):
        self.client.force_authenticate(user=self.admin_user)
        change_res = self.client.post('/api/auth/change-password/', {
            'current_password': 'adminpassword123',
            'new_password': 'betteradminpass456',
            'confirm_password': 'betteradminpass456'
        }, format='json')
        self.assertEqual(change_res.status_code, status.HTTP_200_OK)

        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.check_password('betteradminpass456'))

    def test_non_staff_login_is_rejected_for_admin_portal(self):
        user = User.objects.create_user(
            username='listener',
            email='listener@example.com',
            password='listenerpass123'
        )
        self.client.force_authenticate(user=user)
        captcha_token, captcha_answer = _solve_captcha(self.client)
        login_res = self.client.post('/api/auth/login/', {
            'username': 'listener',
            'password': 'listenerpass123',
            'captcha_token': captcha_token,
            'captcha_answer': captcha_answer,
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_login_requires_captcha(self):
        # Missing captcha entirely
        res = self.client.post('/api/auth/login/', {
            'username': 'testadmin',
            'password': 'adminpassword123',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('captcha', res.json()['error'].lower())

    def test_login_rejects_wrong_captcha(self):
        captcha_token, _ = _solve_captcha(self.client)
        res = self.client.post('/api/auth/login/', {
            'username': 'testadmin',
            'password': 'adminpassword123',
            'captcha_token': captcha_token,
            'captcha_answer': '999',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('incorrect', res.json()['error'].lower())

    def test_login_rejects_tampered_captcha_token(self):
        captcha_token, captcha_answer = _solve_captcha(self.client)
        # Tamper with the signed token payload
        tampered = captcha_token[:-2] + ('00' if not captcha_token.endswith('00') else '11')
        res = self.client.post('/api/auth/login/', {
            'username': 'testadmin',
            'password': 'adminpassword123',
            'captcha_token': tampered,
            'captcha_answer': captcha_answer,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_rejects_replayed_captcha(self):
        captcha_token, captcha_answer = _solve_captcha(self.client)
        payload = {
            'username': 'testadmin',
            'password': 'adminpassword123',
            'captcha_token': captcha_token,
            'captcha_answer': captcha_answer,
        }
        first = self.client.post('/api/auth/login/', payload, format='json')
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        # Reusing the same single-use token must fail even with correct answer
        replay = self.client.post('/api/auth/login/', payload, format='json')
        self.assertEqual(replay.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('used', replay.json()['error'].lower())


class AdminBulkManagementTests(TestCase):
    """Bulk song operations + genre/artist lifecycle management."""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='bulkadmin', email='bulk@admin.com', password='adminpassword123'
        )
        self.client.force_authenticate(user=self.admin_user)

        self.artist = Artist.objects.create(display_name='Narayan Gopal')
        self.other_artist = Artist.objects.create(display_name='Rajesh Payal Rai')

        self.popular_genre = Genre.objects.create(
            name='Adhunik Geet', slug='adhunik-geet', category='popular'
        )
        self.folk_genre = Genre.objects.create(
            name='Lok Dohori', slug='lok-dohori', category='folk'
        )
        # Counterpart of the folk genre inside the popular category, used by
        # the move_category name-matching logic.
        self.folk_counterpart = Genre.objects.create(
            name='Lok Dohori Modern', slug='lok-dohori-modern', category='popular'
        )

        self.published_song = Song.objects.create(
            title='Kehi Mitho Baat Gara', artist=self.artist,
            primary_genre=self.popular_genre, release_year=1980, decade='1980s',
            language='Nepali', provider_video_id='abc123',
            publication_status='published'
        )
        self.draft_song = Song.objects.create(
            title='Maya Garchu Malai', artist=self.artist,
            primary_genre=self.folk_genre, release_year=1990, decade='1990s',
            language='Nepali', provider_video_id='def456',
            publication_status='draft'
        )
        self.station = Station.objects.create(slug='purano-radio', title='Purano Radio')
        StationSong.objects.create(station=self.station, song=self.published_song, position=0)

    def test_admin_song_list_supports_filters_and_pagination(self):
        res = self.client.get('/api/admin/songs/?status=draft')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body['count'], 1)
        self.assertEqual(body['results'][0]['title'], 'Maya Garchu Malai')

        res = self.client.get('/api/admin/songs/?category=folk&page_size=1')
        body = res.json()
        self.assertEqual(body['count'], 1)
        self.assertEqual(body['page_size'], 1)

        # Unauthenticated users are still locked out
        anon = APIClient()
        self.assertEqual(anon.get('/api/admin/songs/').status_code, status.HTTP_403_FORBIDDEN)

    def test_bulk_move_genre(self):
        res = self.client.post('/api/admin/songs/bulk/', {
            'action': 'move_genre',
            'ids': [self.published_song.id, self.draft_song.id],
            'genre_id': self.folk_genre.id,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        # draft_song already sits in the folk genre
        self.assertEqual(body['affected'], 1)
        self.assertEqual(body['already_in_genre'], 1)

        self.published_song.refresh_from_db()
        self.assertEqual(self.published_song.primary_genre_id, self.folk_genre.id)

        audit = AuditLog.objects.filter(action='SONG_BULK_MOVE_GENRE').first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.actor_username, 'bulkadmin')

    def test_bulk_move_category_with_mapping_and_fallback(self):
        # Move everything in the folk category into popular. 'Lok Dohori' gets an
        # explicit mapping; any other folk-genre song would use the fallback.
        res = self.client.post('/api/admin/songs/bulk/', {
            'action': 'move_category',
            'filter': {'category': 'folk'},
            'source_category': 'folk',
            'target_category': 'popular',
            'mapping': {str(self.folk_genre.id): self.folk_counterpart.id},
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body['affected'], 1)
        self.assertEqual(body['moved_to_fallback_genre'], 0)
        self.assertEqual(body['skipped'], 0)

        self.draft_song.refresh_from_db()
        self.assertEqual(self.draft_song.primary_genre_id, self.folk_counterpart.id)
        self.assertEqual(self.draft_song.primary_genre.category, 'popular')

    def test_bulk_move_category_rejects_target_outside_category(self):
        res = self.client.post('/api/admin/songs/bulk/', {
            'action': 'move_category',
            'ids': [self.draft_song.id],
            'target_category': 'regional',
            'genre_id': self.popular_genre.id,  # genre lives in 'popular', not 'regional'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_delete_removes_songs_and_station_links(self):
        preview = self.client.post('/api/admin/songs/bulk/', {
            'action': 'delete', 'ids': [self.published_song.id], 'preview': True,
        }, format='json').json()
        self.assertTrue(preview['preview'])
        self.assertEqual(preview['affected'], 1)
        self.assertEqual(preview['station_links_removed'], 1)
        # Preview must not delete anything
        self.assertTrue(Song.objects.filter(pk=self.published_song.id).exists())

        res = self.client.post('/api/admin/songs/bulk/', {
            'action': 'delete', 'ids': [self.published_song.id],
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['affected'], 1)
        self.assertFalse(Song.objects.filter(pk=self.published_song.id).exists())
        self.assertFalse(StationSong.objects.filter(song=self.published_song).exists())

    def test_bulk_requires_ids_or_filter(self):
        res = self.client.post('/api/admin/songs/bulk/', {'action': 'delete'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_set_status_and_language(self):
        res = self.client.post('/api/admin/songs/bulk/', {
            'action': 'set_status', 'ids': [self.draft_song.id], 'value': 'published',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.draft_song.refresh_from_db()
        self.assertEqual(self.draft_song.publication_status, 'published')

        res = self.client.post('/api/admin/songs/bulk/', {
            'action': 'set_language', 'ids': [self.draft_song.id], 'value': 'Hindi',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.draft_song.refresh_from_db()
        self.assertEqual(self.draft_song.language, 'Hindi')

    def test_bulk_rejects_invalid_values(self):
        res = self.client.post('/api/admin/songs/bulk/', {
            'action': 'set_status', 'ids': [self.draft_song.id], 'value': 'nonsense',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res = self.client.post('/api/admin/songs/bulk/', {
            'action': 'set_decade', 'ids': [self.draft_song.id], 'value': 'nineties',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bulk_add_to_station_is_idempotent(self):
        res = self.client.post('/api/admin/songs/bulk/', {
            'action': 'add_to_station', 'ids': [self.published_song.id, self.draft_song.id],
            'station_id': self.station.id,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body['affected'], 1)          # one already in station
        self.assertEqual(body['already_in_station'], 1)

        res = self.client.post('/api/admin/songs/bulk/', {
            'action': 'remove_from_station', 'ids': [self.published_song.id],
            'station_id': self.station.id,
        }, format='json')
        self.assertEqual(res.json()['affected'], 1)
        self.assertFalse(StationSong.objects.filter(station=self.station, song=self.published_song).exists())

    def test_genre_create_update_and_safe_delete(self):
        res = self.client.post('/api/admin/genres/', {
            'name': 'Bhajan', 'category': 'classical_traditional',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        genre = res.json()
        self.assertEqual(genre['slug'], 'bhajan')

        res = self.client.patch(f"/api/admin/genres/{genre['id']}/", {
            'category': 'special',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['category'], 'special')

        # Unused genres delete fine
        res = self.client.delete(f"/api/admin/genres/{genre['id']}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Deleting a genre with songs requires a reassignment target
        res = self.client.delete(f'/api/admin/genres/{self.folk_genre.id}/')
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)

        res = self.client.delete(
            f'/api/admin/genres/{self.folk_genre.id}/?reassign_to={self.popular_genre.id}'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.draft_song.refresh_from_db()
        self.assertEqual(self.draft_song.primary_genre_id, self.popular_genre.id)
        self.assertFalse(Genre.objects.filter(pk=self.folk_genre.id).exists())

    def test_artist_patch_delete_and_merge(self):
        res = self.client.patch(f'/api/admin/artists/{self.artist.id}/', {
            'display_name': 'Narayan Gopal (Swor Samrat)',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['display_name'], 'Narayan Gopal (Swor Samrat)')

        # Deleting an artist with songs must ask for a target
        res = self.client.delete(f'/api/admin/artists/{self.artist.id}/')
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)

        # Merging: reassign songs onto the other artist, then delete
        res = self.client.delete(
            f'/api/admin/artists/{self.artist.id}/?reassign_to={self.other_artist.id}'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.published_song.refresh_from_db()
        self.assertEqual(self.published_song.artist_id, self.other_artist.id)
        self.assertFalse(Artist.objects.filter(pk=self.artist.id).exists())

    def test_admin_stats_breakdowns(self):
        res = self.client.get('/api/admin/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body['total_songs'], 2)
        self.assertEqual(body['published_songs'], 1)
        self.assertEqual(body['status_breakdown']['draft'], 1)
        self.assertIn('folk', body['category_breakdown'])


class AdminTaxonomyFlexibilityTests(TestCase):
    """Dynamic genre categories, station CRUD, secondary genres, ticket workflow."""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='flexadmin', email='flex@admin.com', password='adminpassword123'
        )
        self.client.force_authenticate(user=self.admin_user)

        self.artist = Artist.objects.create(display_name='Narayan Gopal')
        self.popular_genre = Genre.objects.create(name='Adhunik Geet', slug='adhunik-geet', category='popular')
        self.folk_genre = Genre.objects.create(name='Lok Dohori', slug='lok-dohori', category='folk')
        self.song = Song.objects.create(
            title='Kehi Mitho Baat Gara', artist=self.artist,
            primary_genre=self.popular_genre, release_year=1980, decade='1980s',
            language='Nepali', provider_video_id='abc123', publication_status='published'
        )

    def test_genre_category_crud(self):
        # Defaults are seeded automatically
        res = self.client.get('/api/admin/genre-categories/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('popular', [c['slug'] for c in res.json()])

        # Create a brand-new category
        res = self.client.post('/api/admin/genre-categories/', {'name': 'Devotional'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        cat = res.json()
        self.assertEqual(cat['slug'], 'devotional')

        # A genre can now live in the new category
        res = self.client.post('/api/admin/genres/', {'name': 'Bhajan', 'category': 'devotional'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.json()['category'], 'devotional')

        # Rename + reorder the category
        res = self.client.patch(f"/api/admin/genre-categories/{cat['id']}/", {'name': 'Devotional & Spiritual', 'display_order': 1}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['name'], 'Devotional & Spiritual')

        # Deleting a category holding genres requires reassignment
        res = self.client.delete(f"/api/admin/genre-categories/{cat['id']}/")
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)

        # Reassign its genres into 'popular' then delete
        res = self.client.delete(f"/api/admin/genre-categories/{cat['id']}/?reassign_to=popular")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Genre.objects.get(name='Bhajan').category, 'popular')
        self.assertFalse(GenreCategory.objects.filter(pk=cat['id']).exists())

    def test_genre_create_rejects_unknown_category(self):
        res = self.client.post('/api/admin/genres/', {'name': 'Mystery', 'category': 'not_a_real_category'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.json())

    def test_station_create_and_delete(self):
        res = self.client.post('/api/admin/stations/', {'title': 'Tea Shop Radio'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        station_id = res.json()['id']
        self.assertEqual(res.json()['slug'], 'tea-shop-radio')

        res = self.client.delete(f'/api/admin/stations/{station_id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(Station.objects.filter(pk=station_id).exists())

    def test_song_secondary_genres(self):
        res = self.client.patch(f'/api/admin/songs/{self.song.id}/', {
            'secondary_genres': [self.folk_genre.id],
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.song.refresh_from_db()
        self.assertEqual(list(self.song.secondary_genres.values_list('id', flat=True)), [self.folk_genre.id])
        self.assertEqual(res.json()['secondary_genre_names'], ['Lok Dohori'])

    def test_public_genre_categories_endpoint(self):
        anon = APIClient()
        res = anon.get('/api/genre-categories/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(any(c['slug'] == 'popular' for c in res.json()))

    def test_takedown_list_filters_and_action(self):
        ticket = TakedownRequest.objects.create(
            song=self.song, claimant_name='Producer', claimant_email='p@x.com',
            reason='copyright', details='please review'
        )

        # Filter by status
        res = self.client.get('/api/admin/takedowns/?status=pending')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body['count'], 1)
        self.assertIn('available_statuses', body)

        # Resolve the ticket with a note
        res = self.client.post(f'/api/admin/takedowns/{ticket.id}/action/', {
            'status': 'content_unpublished', 'resolution_notes': 'verified claim'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.song.refresh_from_db()
        self.assertEqual(self.song.publication_status, 'taken_down')

        # Public status tracking
        anon = APIClient()
        res = anon.get(f'/api/takedown-request/{ticket.id}/status/?email=p@x.com')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()['status'], 'content_unpublished')


class AdminStationQueueTests(TestCase):
    """Add / reorder / remove songs in a station's queue."""

    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='queueadmin', email='q@admin.com', password='adminpassword123'
        )
        self.client.force_authenticate(user=self.admin_user)
        self.artist = Artist.objects.create(display_name='Narayan Gopal')
        self.station = Station.objects.create(slug='purano-radio', title='Purano Radio')
        self.song1 = Song.objects.create(title='A', artist=self.artist, provider_video_id='a1', publication_status='published')
        self.song2 = Song.objects.create(title='B', artist=self.artist, provider_video_id='b2', publication_status='published')
        self.song3 = Song.objects.create(title='C', artist=self.artist, provider_video_id='c3', publication_status='published')

    def test_queue_add_reorder_remove(self):
        base = f'/api/admin/stations/{self.station.id}/queue/'

        # Add two songs
        res = self.client.post(base, {'song_ids': [self.song1.id, self.song2.id]}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.json()['added'], [self.song1.id, self.song2.id])
        self.assertEqual([row['song_id'] for row in res.json()['queue']], [self.song1.id, self.song2.id])

        # Re-adding is idempotent
        res = self.client.post(base, {'song_ids': [self.song1.id]}, format='json')
        self.assertEqual(res.json()['added'], [])
        self.assertEqual(res.json()['skipped'], [self.song1.id])

        # Reorder: put song2 first
        res = self.client.patch(base, {'order': [self.song2.id, self.song1.id]}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual([row['song_id'] for row in res.json()['queue']], [self.song2.id, self.song1.id])

        # Remove song1
        res = self.client.delete(f'{base}?song={self.song1.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual([row['song_id'] for row in res.json()['queue']], [self.song2.id])

        # Removing a song not in the queue 404s
        res = self.client.delete(f'{base}?song={self.song3.id}')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_queue_requires_admin(self):
        anon = APIClient()
        base = f'/api/admin/stations/{self.station.id}/queue/'
        self.assertEqual(anon.get(base).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(anon.post(base, {'song_id': self.song1.id}, format='json').status_code, status.HTTP_403_FORBIDDEN)
