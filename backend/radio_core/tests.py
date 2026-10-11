import json
import re

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from radio_core.models import (
    Artist, Genre, Song, Station, StationSong,
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
