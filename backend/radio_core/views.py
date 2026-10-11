import random

from django.db.models import Count, Q, F
from django.core import signing
from django.core.cache import cache
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny

from .models import (
    Artist, Genre, Song, Station, StationSong,
    Favorite, PlaybackEvent, TakedownRequest, AuditLog
)
from .serializers import (
    ArtistSerializer, GenreSerializer, SongSerializer,
    StationSerializer, StationDetailSerializer,
    FavoriteSerializer, PlaybackEventSerializer,
    TakedownRequestSerializer, AuditLogSerializer
)


def _auth_payload(user):
    return {
        'authenticated': True,
        'username': user.username,
        'full_name': user.get_full_name(),
        'email': user.email,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'date_joined': user.date_joined,
        'last_login': user.last_login,
        'permissions': {
            'can_manage_catalog': user.is_staff or user.is_superuser,
            'can_review_takedowns': user.is_staff or user.is_superuser,
            'can_view_audit_logs': user.is_staff or user.is_superuser,
            'can_change_password': True,
        },
    }


class CatalogPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = 'page_size'
    max_page_size = 100


class StationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        stations = Station.objects.filter(is_active=True).annotate(
            songs_count=Count('station_songs', filter=Q(station_songs__song__publication_status='published'))
        ).order_by('display_order', 'title')
        serializer = StationSerializer(stations, many=True)
        return Response(serializer.data)


class StationDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, slug):
        try:
            station = Station.objects.get(slug=slug, is_active=True)
        except Station.DoesNotExist:
            return Response({'error': 'Station not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = StationDetailSerializer(station)
        return Response(serializer.data)


class SongListView(APIView):
    permission_classes = [AllowAny]
    pagination_class = CatalogPagination

    def get(self, request):
        queryset = Song.objects.filter(publication_status='published').select_related(
            'artist', 'primary_genre'
        )

        # Search parameter (supports Devanagari, English, Romanized)
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(title_ne__icontains=search_query) |
                Q(romanized_title__icontains=search_query) |
                Q(artist__display_name__icontains=search_query) |
                Q(artist__display_name_ne__icontains=search_query) |
                Q(album__icontains=search_query) |
                Q(composer__icontains=search_query) |
                Q(lyricist__icontains=search_query)
            )

        # Genre filter
        genre_slug = request.query_params.get('genre')
        if genre_slug:
            queryset = queryset.filter(
                Q(primary_genre__slug=genre_slug) |
                Q(secondary_genres__slug=genre_slug)
            ).distinct()

        # Decade filter
        decade = request.query_params.get('decade')
        if decade:
            queryset = queryset.filter(decade=decade)

        # Language filter
        language = request.query_params.get('language')
        if language:
            queryset = queryset.filter(language__iexact=language)

        # Verification status filter
        verification = request.query_params.get('verification')
        if verification:
            queryset = queryset.filter(metadata_verification_status=verification)

        # Sorting
        ordering = request.query_params.get('ordering', '-release_year')
        allowed_orderings = ['-release_year', 'release_year', 'title', '-title', '-play_count', 'play_count', '-created_at']
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by('-release_year', 'title')

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = SongSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = SongSerializer(queryset, many=True)
        return Response(serializer.data)


class SongDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            song = Song.objects.select_related('artist', 'primary_genre').prefetch_related('secondary_genres').get(
                pk=pk, publication_status='published'
            )
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SongSerializer(song)
        return Response(serializer.data)


class ArtistListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        artists = Artist.objects.annotate(
            songs_count=Count('songs', filter=Q(songs__publication_status='published'))
        ).order_by('-songs_count', 'display_name')
        
        search = request.query_params.get('search', '').strip()
        if search:
            artists = artists.filter(
                Q(display_name__icontains=search) |
                Q(display_name_ne__icontains=search)
            )

        serializer = ArtistSerializer(artists, many=True)
        return Response(serializer.data)


class GenreListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        genres = Genre.objects.filter(is_active=True).annotate(
            songs_count=Count('primary_songs', filter=Q(primary_songs__publication_status='published'))
        ).order_by('category', 'name')
        serializer = GenreSerializer(genres, many=True)
        return Response(serializer.data)


class DecadesListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        decades = (
            Song.objects.filter(publication_status='published', decade__gt='')
            .values('decade')
            .annotate(count=Count('id'))
            .order_by('decade')
        )
        return Response(decades)


class LanguageListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        languages = (
            Song.objects.filter(publication_status='published')
            .values('language')
            .annotate(count=Count('id'))
            .order_by('language')
        )
        return Response(languages)


class FeaturedContentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        featured_stations = Station.objects.filter(is_active=True, is_featured=True).annotate(
            songs_count=Count('station_songs', filter=Q(station_songs__song__publication_status='published'))
        )[:6]
        
        featured_songs = Song.objects.filter(
            publication_status='published',
            metadata_verification_status='verified'
        ).select_related('artist', 'primary_genre')[:8]
        if not featured_songs.exists():
            featured_songs = Song.objects.filter(
                publication_status='published'
            ).select_related('artist', 'primary_genre')[:8]

        return Response({
            'stations': StationSerializer(featured_stations, many=True).data,
            'songs': SongSerializer(featured_songs, many=True).data
        })


class FavoriteListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        session_key = request.headers.get('X-Session-Key') or request.query_params.get('session_key', '')
        if not session_key and not request.user.is_authenticated:
            return Response([])

        if request.user.is_authenticated:
            favorites = Favorite.objects.filter(user=request.user).select_related('song', 'song__artist', 'song__primary_genre')
        else:
            favorites = Favorite.objects.filter(session_key=session_key).select_related('song', 'song__artist', 'song__primary_genre')

        serializer = FavoriteSerializer(favorites, many=True)
        return Response(serializer.data)

    def post(self, request):
        session_key = request.headers.get('X-Session-Key') or request.data.get('session_key', '')
        song_id = request.data.get('song_id')

        if not song_id:
            return Response({'error': 'song_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            song = Song.objects.get(pk=song_id, publication_status='published')
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user if request.user.is_authenticated else None
        
        if user:
            fav, created = Favorite.objects.get_or_create(user=user, song=song)
        elif session_key:
            fav, created = Favorite.objects.get_or_create(session_key=session_key, song=song)
        else:
            return Response({'error': 'Session key or user authentication required'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(FavoriteSerializer(fav).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def delete(self, request):
        session_key = request.headers.get('X-Session-Key') or request.query_params.get('session_key', '')
        song_id = request.query_params.get('song_id')

        if not song_id:
            return Response({'error': 'song_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user if request.user.is_authenticated else None
        if user:
            Favorite.objects.filter(user=user, song_id=song_id).delete()
        elif session_key:
            Favorite.objects.filter(session_key=session_key, song_id=song_id).delete()
        else:
            return Response({'error': 'Session key or authentication required'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Removed from favorites'}, status=status.HTTP_200_OK)


class PlaybackEventView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PlaybackEventSerializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save()
            # Increment play count on track completion
            if event.event_type in ('complete', 'start') and event.song:
                Song.objects.filter(id=event.song.id).update(play_count=F('play_count') + 1)
            return Response({'status': 'recorded'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TakedownSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TakedownRequestSerializer(data=request.data)
        if serializer.is_valid():
            ticket = serializer.save()
            
            # Create audit trail
            AuditLog.objects.create(
                actor_username='public_reporter',
                action='TAKEDOWN_SUBMITTED',
                target_model='Song',
                target_id=str(ticket.song_id),
                details={
                    'reason': ticket.reason,
                    'claimant_email': ticket.claimant_email,
                    'ticket_id': ticket.id
                }
            )
            return Response({
                'message': 'Your report has been received and logged for review.',
                'ticket_id': ticket.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------
# Admin Protected Views
# ---------------------

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_songs = Song.objects.count()
        published_songs = Song.objects.filter(publication_status='published').count()
        verified_songs = Song.objects.filter(metadata_verification_status='verified').count()
        pending_takedowns = TakedownRequest.objects.filter(status='pending').count()
        total_artists = Artist.objects.count()
        total_stations = Station.objects.count()

        return Response({
            'total_songs': total_songs,
            'published_songs': published_songs,
            'verified_songs': verified_songs,
            'pending_takedowns': pending_takedowns,
            'total_artists': total_artists,
            'total_stations': total_stations
        })


class AdminSongManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk=None):
        if pk:
            try:
                song = Song.objects.select_related('artist', 'primary_genre').get(pk=pk)
                return Response(SongSerializer(song).data)
            except Song.DoesNotExist:
                return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)
        songs = Song.objects.select_related('artist', 'primary_genre').order_by('-id')
        serializer = SongSerializer(songs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SongSerializer(data=request.data)
        if serializer.is_valid():
            song = serializer.save()
            AuditLog.objects.create(
                actor_username=request.user.username,
                action='SONG_CREATED',
                target_model='Song',
                target_id=str(song.id),
                details=serializer.data
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        try:
            song = Song.objects.get(pk=pk)
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SongSerializer(song, data=request.data, partial=True)
        if serializer.is_valid():
            song = serializer.save()
            AuditLog.objects.create(
                actor_username=request.user.username,
                action='SONG_UPDATED',
                target_model='Song',
                target_id=str(song.id),
                details=request.data
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            song = Song.objects.get(pk=pk)
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)

        # Soft delete / unpublish
        song.publication_status = 'taken_down'
        song.save(update_fields=['publication_status'])

        AuditLog.objects.create(
            actor_username=request.user.username,
            action='SONG_UNPUBLISHED',
            target_model='Song',
            target_id=str(song.id),
            details={'reason': 'Admin action'}
        )
        return Response({'message': f'Song {song.title} unpublished.'})


class AdminArtistManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        artists = Artist.objects.order_by('display_name')
        return Response(ArtistSerializer(artists, many=True).data)

    def post(self, request):
        serializer = ArtistSerializer(data=request.data)
        if serializer.is_valid():
            artist = serializer.save()
            AuditLog.objects.create(
                actor_username=request.user.username,
                action='ARTIST_CREATED',
                target_model='Artist',
                target_id=str(artist.id),
                details=serializer.data
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminStationManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk=None):
        if pk:
            try:
                st = Station.objects.get(pk=pk)
                return Response(StationSerializer(st).data)
            except Station.DoesNotExist:
                return Response({'error': 'Station not found'}, status=status.HTTP_404_NOT_FOUND)
        stations = Station.objects.order_by('display_order')
        return Response(StationSerializer(stations, many=True).data)

    def patch(self, request, pk):
        try:
            st = Station.objects.get(pk=pk)
        except Station.DoesNotExist:
            return Response({'error': 'Station not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = StationSerializer(st, data=request.data, partial=True)
        if serializer.is_valid():
            st = serializer.save()
            AuditLog.objects.create(
                actor_username=request.user.username,
                action='STATION_UPDATED',
                target_model='Station',
                target_id=str(st.id),
                details=request.data
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminTakedownListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        reports = TakedownRequest.objects.select_related('song', 'song__artist').order_by('-created_at')
        serializer = TakedownRequestSerializer(reports, many=True)
        return Response(serializer.data)


class AdminTakedownActionView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            report = TakedownRequest.objects.get(pk=pk)
        except TakedownRequest.DoesNotExist:
            return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        resolution_notes = request.data.get('resolution_notes', '')

        if new_status not in dict(TakedownRequest.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        report.status = new_status
        report.resolution_notes = resolution_notes
        if new_status in ('content_unpublished', 'resolved_kept', 'rejected'):
            report.resolved_at = timezone.now()
        report.save()

        # If decision is content_unpublished, unpublish song immediately
        if new_status == 'content_unpublished':
            report.song.publication_status = 'taken_down'
            report.song.save(update_fields=['publication_status'])

        AuditLog.objects.create(
            actor_username=request.user.username,
            action=f'TAKEDOWN_{new_status.upper()}',
            target_model='TakedownRequest',
            target_id=str(report.id),
            details={'song_id': report.song_id, 'notes': resolution_notes}
        )

        return Response(TakedownRequestSerializer(report).data)


class AdminAuditLogsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logs = AuditLog.objects.order_by('-timestamp')[:100]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


# ---------------------
# Auth API Views
# ---------------------

CAPTCHA_SALT = 'radio_core.admin_login_captcha'


class AuthCaptchaView(APIView):
    """Issues a signed, single-use arithmetic challenge for the admin login form."""
    permission_classes = [AllowAny]

    def get(self, request):
        a = random.randint(1, 9)
        b = random.randint(1, 9)
        token = signing.dumps({'answer': a + b}, salt=CAPTCHA_SALT)
        return Response({'question': f'{a} + {b} = ?', 'token': token})


class AuthLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        captcha_token = request.data.get('captcha_token', '')
        captcha_answer = request.data.get('captcha_answer', '')

        if not username or not password:
            return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify server-issued captcha before touching credentials
        if not captcha_token or str(captcha_answer).strip() == '':
            return Response(
                {'error': 'Captcha verification is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            captcha_payload = signing.loads(captcha_token, salt=CAPTCHA_SALT, max_age=300)
        except signing.BadSignature:
            return Response(
                {'error': 'Captcha expired or invalid. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Enforce single use so a token cannot be replayed within its lifetime
        captcha_cache_key = f'admin-login-captcha:{captcha_token}'
        if cache.get(captcha_cache_key):
            return Response(
                {'error': 'Captcha already used. Please solve a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        cache.set(captcha_cache_key, 1, 300)

        if str(captcha_answer).strip() != str(captcha_payload.get('answer')):
            return Response(
                {'error': 'Captcha answer is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_staff and not user.is_superuser:
            return Response({'error': 'Admin access requires a staff account'}, status=status.HTTP_403_FORBIDDEN)

        login(request, user)
        return Response(_auth_payload(user))


@method_decorator(ensure_csrf_cookie, name='dispatch')
class AuthCsrfView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'csrf_token': get_token(request)})


class AuthLogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'})


class AuthUserView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response(_auth_payload(request.user))
        return Response({'authenticated': False})


class AuthChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.is_staff and not user.is_superuser:
            return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not current_password or not new_password or not confirm_password:
            return Response({'error': 'All password fields are required'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'error': 'New password confirmation does not match'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=user)
        except ValidationError as exc:
            return Response({'error': 'Password does not meet security requirements', 'details': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])
        update_session_auth_hash(request, user)

        return Response({
            'message': 'Password updated successfully',
            'user': _auth_payload(user),
        })
