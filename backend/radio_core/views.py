import random
import re

from django.db import transaction
from django.db.models import Count, Q, F
from django.core import signing
from django.core.cache import cache
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.text import slugify
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
    Favorite, PlaybackEvent, TakedownRequest, AuditLog,
    category_slug, ensure_default_genre_categories
)
from .serializers import (
    ArtistSerializer, GenreSerializer, SongSerializer,
    StationSerializer, StationDetailSerializer,
    FavoriteSerializer, PlaybackEventSerializer,
    TakedownRequestSerializer, AuditLogSerializer
)
from .genre_category_views import (
    AdminGenreCategoryManagementView,
    AdminGenreCategoryDetailManagementView,
    category_registry,
    category_counts,
    category_payload,
)
from .station_queue_views import AdminStationQueueView


def _validate_genre_category(value):
    """Ensure a genre category slug exists in the registry (raises ValidationError)."""
    from .genre_category_views import validate_genre_category
    try:
        return validate_genre_category(value)
    except ValueError as exc:
        raise ValidationError(str(exc))


def _category_label_map():
    """Map category slug -> display name for admin payloads."""
    return {c.slug: c.name for c in category_registry()}


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


class GenreCategoryListView(APIView):
    """Public, ordered list of the genre categories shown as filter groups."""

    permission_classes = [AllowAny]

    def get(self, request):
        categories = category_registry()
        if request.query_params.get('include_inactive') != 'true':
            categories = [c for c in categories if c.is_active]
        genre_counts, song_counts = category_counts()
        return Response([category_payload(c, genre_counts, song_counts) for c in categories])


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
        total_genres = Genre.objects.count()
        total_genre_categories = len(category_registry())

        status_breakdown = {
            row['publication_status']: row['total']
            for row in Song.objects.values('publication_status').annotate(total=Count('id'))
        }
        language_breakdown = {
            row['language']: row['total']
            for row in Song.objects.values('language').annotate(total=Count('id')).order_by('-total')
        }
        category_breakdown = {
            row['primary_genre__category']: row['total']
            for row in Song.objects.filter(primary_genre__isnull=False)
            .values('primary_genre__category').annotate(total=Count('id'))
        }
        takedown_breakdown = {
            row['status']: row['total']
            for row in TakedownRequest.objects.values('status').annotate(total=Count('id'))
        }

        return Response({
            'total_songs': total_songs,
            'published_songs': published_songs,
            'verified_songs': verified_songs,
            'pending_takedowns': pending_takedowns,
            'total_artists': total_artists,
            'total_stations': total_stations,
            'total_genres': total_genres,
            'total_genre_categories': total_genre_categories,
            'status_breakdown': status_breakdown,
            'language_breakdown': language_breakdown,
            'category_breakdown': category_breakdown,
            'takedown_breakdown': takedown_breakdown,
        })


def _filter_admin_songs(queryset, params):
    """Shared filter pipeline for the admin catalog list and bulk actions."""
    search_query = (params.get('search') or '').strip()
    if search_query:
        queryset = queryset.filter(
            Q(title__icontains=search_query) |
            Q(title_ne__icontains=search_query) |
            Q(romanized_title__icontains=search_query) |
            Q(artist__display_name__icontains=search_query) |
            Q(artist__display_name_ne__icontains=search_query) |
            Q(album__icontains=search_query) |
            Q(composer__icontains=search_query) |
            Q(lyricist__icontains=search_query) |
            Q(provider_video_id__icontains=search_query)
        )

    publication_status = (params.get('status') or '').strip()
    if publication_status:
        queryset = queryset.filter(publication_status=publication_status)

    genre = (params.get('genre') or '').strip()
    if genre:
        if genre.isdigit():
            queryset = queryset.filter(
                Q(primary_genre_id=genre) | Q(secondary_genres__id=genre)
            ).distinct()
        else:
            queryset = queryset.filter(
                Q(primary_genre__slug=genre) | Q(secondary_genres__slug=genre)
            ).distinct()

    category = (params.get('category') or '').strip()
    if category:
        queryset = queryset.filter(primary_genre__category=category)

    artist = (params.get('artist') or '').strip()
    if artist.isdigit():
        queryset = queryset.filter(artist_id=artist)

    language = (params.get('language') or '').strip()
    if language:
        queryset = queryset.filter(language__iexact=language)

    decade = (params.get('decade') or '').strip()
    if decade:
        queryset = queryset.filter(decade=decade)

    verification = (params.get('verification') or '').strip()
    if verification:
        queryset = queryset.filter(metadata_verification_status=verification)

    return queryset


ADMIN_SONG_ORDERINGS = [
    '-release_year', 'release_year', 'title', '-title',
    '-play_count', 'play_count', '-created_at', 'id', '-id',
]


class AdminSongManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk=None):
        if pk:
            try:
                song = Song.objects.select_related('artist', 'primary_genre').get(pk=pk)
                return Response(SongSerializer(song).data)
            except Song.DoesNotExist:
                return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)

        # Full management list: every publication status, filterable + paginated.
        songs = _filter_admin_songs(Song.objects.all(), request.query_params)

        ordering = request.query_params.get('ordering', '-id')
        if ordering not in ADMIN_SONG_ORDERINGS:
            ordering = '-id'
        songs = songs.select_related('artist', 'primary_genre').order_by(ordering)

        try:
            page_size = int(request.query_params.get('page_size', 25))
        except (TypeError, ValueError):
            page_size = 25
        page_size = max(1, min(page_size, 200))

        try:
            page_number = int(request.query_params.get('page', 1))
        except (TypeError, ValueError):
            page_number = 1
        page_number = max(1, page_number)

        total = songs.count()
        start = (page_number - 1) * page_size
        results = SongSerializer(songs[start:start + page_size], many=True).data

        return Response({
            'count': total,
            'page': page_number,
            'page_size': page_size,
            'results': results,
        })

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


class AdminSongBulkActionView(APIView):
    """One endpoint for every bulk catalog operation.

    Payload:
        action   – one of BULK_ACTIONS below
        ids      – explicit list of song ids (preferred)
        filter   – alternatively target every song matching these filters
        preview  – when true, report what would change without changing it
        + action-specific params (genre_id, target_category, value, station_id, ...)
    """

    permission_classes = [IsAdminUser]
    PUBLICATION_STATUSES = {'published', 'draft', 'disputed', 'taken_down'}
    VERIFICATION_STATUSES = {'verified', 'community_submitted', 'demo'}
    BULK_ACTIONS = {
        'delete', 'set_status', 'set_verification', 'move_genre', 'move_category',
        'set_language', 'set_decade', 'assign_artist', 'reset_play_counts',
        'add_to_station', 'remove_from_station',
    }

    def _resolve_queryset(self, request):
        ids = request.data.get('ids') or []
        filter_spec = request.data.get('filter') or {}

        if ids:
            try:
                id_list = [int(i) for i in ids]
            except (TypeError, ValueError):
                return None, Response({'error': 'ids must be a list of integers'}, status=status.HTTP_400_BAD_REQUEST)
            queryset = Song.objects.filter(pk__in=id_list)
        elif filter_spec:
            queryset = _filter_admin_songs(Song.objects.all(), filter_spec)
        else:
            return None, Response(
                {'error': "Provide 'ids' or a 'filter' object — refusing to touch the whole catalog blindly."},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset = queryset.select_related('artist', 'primary_genre').prefetch_related('secondary_genres')
        if not queryset.exists():
            return None, Response({'error': 'No songs matched the request'}, status=status.HTTP_400_BAD_REQUEST)
        return queryset, None

    def post(self, request):
        action = (request.data.get('action') or '').strip()
        if action not in self.BULK_ACTIONS:
            return Response(
                {'error': f"Unknown action '{action}'", 'allowed': sorted(self.BULK_ACTIONS)},
                status=status.HTTP_400_BAD_REQUEST
            )

        queryset, error_response = self._resolve_queryset(request)
        if error_response:
            return error_response

        preview = bool(request.data.get('preview', False))
        handler = getattr(self, f'_bulk_{action}')
        try:
            with transaction.atomic():
                result = handler(request, queryset, preview)
        except ValidationError as exc:
            return Response({'error': exc.messages[0] if exc.messages else str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if not preview:
            AuditLog.objects.create(
                actor_username=request.user.username,
                action=f'SONG_BULK_{action.upper()}',
                target_model='Song',
                target_id=f'{result["affected"]} songs',
                details={k: v for k, v in result.items() if k != 'sample_titles'},
            )
        return Response(result)

    # ---- helpers ----

    @staticmethod
    def _require(request, field):
        value = request.data.get(field)
        if value in (None, ''):
            raise ValidationError(f"'{field}' is required for this action")
        return value

    @staticmethod
    def _summary(queryset, updated_ids):
        sample = list(queryset.filter(pk__in=updated_ids).values_list('title', flat=True)[:5])
        return {'sample_titles': sample}

    # ---- actions ----

    def _bulk_delete(self, request, queryset, preview):
        songs = list(queryset)
        song_ids = [song.id for song in songs]
        station_links = StationSong.objects.filter(song_id__in=song_ids).count()
        favorites = Favorite.objects.filter(song_id__in=song_ids).count()
        events = PlaybackEvent.objects.filter(song_id__in=song_ids).count()

        result = {
            'action': 'delete',
            'affected': len(songs),
            'station_links_removed': station_links,
            'favorites_removed': favorites,
            'playback_events_orphaned': events,
            'sample_titles': [song.title for song in songs[:5]],
            'preview': preview,
        }
        if not preview:
            Song.objects.filter(pk__in=song_ids).delete()
        return result

    def _bulk_set_status(self, request, queryset, preview):
        value = self._require(request, 'value')
        if value not in self.PUBLICATION_STATUSES:
            raise ValidationError(f"Invalid publication status '{value}'")
        ids = list(queryset.values_list('id', flat=True))
        if not preview:
            queryset.update(publication_status=value)
        result = {'action': 'set_status', 'value': value, 'affected': len(ids), 'preview': preview}
        result.update(self._summary(queryset, ids))
        return result

    def _bulk_set_verification(self, request, queryset, preview):
        value = self._require(request, 'value')
        if value not in self.VERIFICATION_STATUSES:
            raise ValidationError(f"Invalid verification status '{value}'")
        ids = list(queryset.values_list('id', flat=True))
        if not preview:
            queryset.update(metadata_verification_status=value)
        result = {'action': 'set_verification', 'value': value, 'affected': len(ids), 'preview': preview}
        result.update(self._summary(queryset, ids))
        return result

    def _bulk_move_genre(self, request, queryset, preview):
        genre_id = self._require(request, 'genre_id')
        try:
            genre = Genre.objects.get(pk=genre_id)
        except (Genre.DoesNotExist, ValueError):
            raise ValidationError(f'Genre #{genre_id} does not exist')

        moved, already_there = [], 0
        for song in queryset:
            if song.primary_genre_id == genre.id:
                already_there += 1
                continue
            moved.append(song.id)
            if not preview:
                song.primary_genre = genre
                song.save(update_fields=['primary_genre'])
        result = {
            'action': 'move_genre',
            'genre': {'id': genre.id, 'name': genre.name, 'category': genre.category},
            'affected': len(moved),
            'already_in_genre': already_there,
            'preview': preview,
        }
        result.update(self._summary(queryset, moved))
        return result

    def _bulk_move_category(self, request, queryset, preview):
        """Move songs into a target genre category.

        Params:
            target_category (required) – destination category
            genre_id (optional)        – fallback destination genre (must be in target_category)
            mapping (optional)         – {source_genre_id: target_genre_id} for precise moves
        Songs with no mapping and no fallback are skipped and reported.
        """
        source_category = (request.data.get('source_category') or '').strip()
        target_category = self._require(request, 'target_category')
        fallback_genre_id = request.data.get('genre_id')
        mapping_input = request.data.get('mapping') or {}

        if not isinstance(mapping_input, dict):
            raise ValidationError('mapping must be an object of {source_genre_id: target_genre_id}')

        target_category_genres = {
            genre.id: genre for genre in Genre.objects.filter(category=target_category)
        }
        if not target_category_genres:
            raise ValidationError(
                f"Category '{target_category}' has no genres — create one first"
            )

        mapping = {}
        for source_id, target_id in mapping_input.items():
            try:
                target_id = int(target_id)
            except (TypeError, ValueError):
                raise ValidationError('mapping values must be genre ids')
            if target_id not in target_category_genres:
                raise ValidationError(
                    f'Genre #{target_id} is not in category "{target_category}"'
                )
            mapping[int(source_id)] = target_category_genres[target_id]

        fallback_genre = None
        if fallback_genre_id:
            fallback_genre = target_category_genres.get(int(fallback_genre_id)) if str(fallback_genre_id).isdigit() else None
            if fallback_genre is None:
                raise ValidationError(
                    f'Fallback genre #{fallback_genre_id} does not exist in category "{target_category}"'
                )

        matched, skipped, fallback_used = [], 0, 0
        for song in queryset:
            current = song.primary_genre
            if current and current.category == target_category:
                skipped += 1
                continue
            source_key = current.id if current else None
            mapped_genre = mapping.get(source_key)
            new_genre = mapped_genre or fallback_genre
            if new_genre is None:
                skipped += 1
                continue
            if mapped_genre is None:
                fallback_used += 1
            matched.append(song.id)
            if not preview:
                song.primary_genre = new_genre
                song.save(update_fields=['primary_genre'])
                if current:
                    song.secondary_genres.remove(current)
                    song.secondary_genres.add(new_genre)

        result = {
            'action': 'move_category',
            'source_category': source_category or '(from selection)',
            'target_category': target_category,
            'affected': len(matched),
            'moved_to_fallback_genre': fallback_used,
            'skipped': skipped,
            'preview': preview,
        }
        result.update(self._summary(queryset, matched))
        return result

    def _bulk_set_language(self, request, queryset, preview):
        value = (self._require(request, 'value') or '').strip()
        if len(value) > 50:
            raise ValidationError('Language must be 50 characters or fewer')
        ids = list(queryset.values_list('id', flat=True))
        if not preview:
            queryset.update(language=value)
        result = {'action': 'set_language', 'value': value, 'affected': len(ids), 'preview': preview}
        result.update(self._summary(queryset, ids))
        return result

    def _bulk_set_decade(self, request, queryset, preview):
        value = (self._require(request, 'value') or '').strip()
        if not re.fullmatch(r'\d{4}s', value):
            raise ValidationError("Decade must look like '1980s'")
        ids = list(queryset.values_list('id', flat=True))
        if not preview:
            queryset.update(decade=value)
        result = {'action': 'set_decade', 'value': value, 'affected': len(ids), 'preview': preview}
        result.update(self._summary(queryset, ids))
        return result

    def _bulk_assign_artist(self, request, queryset, preview):
        artist_id = self._require(request, 'artist_id')
        try:
            artist = Artist.objects.get(pk=artist_id)
        except (Artist.DoesNotExist, ValueError):
            raise ValidationError(f'Artist #{artist_id} does not exist')
        ids = list(queryset.values_list('id', flat=True))
        if not preview:
            queryset.update(artist=artist)
        result = {
            'action': 'assign_artist',
            'artist': {'id': artist.id, 'name': artist.display_name},
            'affected': len(ids),
            'preview': preview,
        }
        result.update(self._summary(queryset, ids))
        return result

    def _bulk_reset_play_counts(self, request, queryset, preview):
        try:
            value = int(request.data.get('value', 0))
        except (TypeError, ValueError):
            raise ValidationError('value must be an integer play count')
        value = max(0, value)
        ids = list(queryset.values_list('id', flat=True))
        if not preview:
            queryset.update(play_count=value)
        result = {'action': 'reset_play_counts', 'value': value, 'affected': len(ids), 'preview': preview}
        result.update(self._summary(queryset, ids))
        return result

    def _bulk_add_to_station(self, request, queryset, preview):
        station_id = self._require(request, 'station_id')
        try:
            station = Station.objects.get(pk=station_id)
        except (Station.DoesNotExist, ValueError):
            raise ValidationError(f'Station #{station_id} does not exist')

        existing = set(StationSong.objects.filter(
            station=station, song__in=queryset
        ).values_list('song_id', flat=True))
        song_ids = [song.id for song in queryset if song.id not in existing]

        if not preview and song_ids:
            position = StationSong.objects.filter(station=station).count()
            StationSong.objects.bulk_create([
                StationSong(station=station, song_id=song_id, position=position + offset)
                for offset, song_id in enumerate(song_ids)
            ])

        result = {
            'action': 'add_to_station',
            'station': {'id': station.id, 'title': station.title},
            'affected': len(song_ids),
            'already_in_station': len(existing),
            'preview': preview,
        }
        result.update(self._summary(queryset, song_ids))
        return result

    def _bulk_remove_from_station(self, request, queryset, preview):
        station_id = self._require(request, 'station_id')
        try:
            station = Station.objects.get(pk=station_id)
        except (Station.DoesNotExist, ValueError):
            raise ValidationError(f'Station #{station_id} does not exist')

        links = StationSong.objects.filter(station=station, song__in=queryset)
        count = links.count()
        if not preview:
            links.delete()
        return {
            'action': 'remove_from_station',
            'station': {'id': station.id, 'title': station.title},
            'affected': count,
            'preview': preview,
        }


class AdminGenreManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        genres = Genre.objects.annotate(
            songs_count=Count('primary_songs')
        ).order_by('category', 'name')

        category = request.query_params.get('category')
        if category:
            genres = genres.filter(category=category_slug(category))

        search = (request.query_params.get('search') or '').strip()
        if search:
            genres = genres.filter(Q(name__icontains=search) | Q(name_ne__icontains=search))

        is_active = request.query_params.get('is_active')
        if is_active in ('true', 'false'):
            genres = genres.filter(is_active=(is_active == 'true'))

        return Response(GenreSerializer(genres, many=True).data)

    def post(self, request):
        payload = dict(request.data)
        try:
            payload['category'] = _validate_genre_category(payload.get('category') or 'popular')
        except ValidationError as exc:
            return Response({'error': exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

        serializer = GenreSerializer(data=payload)
        if serializer.is_valid():
            base_slug = slugify(serializer.validated_data.get('name', '')) or 'genre'
            slug = base_slug
            counter = 2
            while Genre.objects.filter(slug=slug).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1

            genre = serializer.save(slug=slug)

            AuditLog.objects.create(
                actor_username=request.user.username,
                action='GENRE_CREATED',
                target_model='Genre',
                target_id=str(genre.id),
                details=serializer.data
            )
            return Response(GenreSerializer(genre).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminGenreDetailManagementView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            genre = Genre.objects.get(pk=pk)
        except Genre.DoesNotExist:
            return Response({'error': 'Genre not found'}, status=status.HTTP_404_NOT_FOUND)

        payload = dict(request.data)
        if 'category' in payload and payload['category'] not in (None, ''):
            try:
                payload['category'] = _validate_genre_category(payload['category'])
            except ValidationError as exc:
                return Response({'error': exc.messages[0]}, status=status.HTTP_400_BAD_REQUEST)

        serializer = GenreSerializer(genre, data=payload, partial=True)
        if serializer.is_valid():
            # Keep the slug in step with a rename unless an explicit slug was sent.
            new_name = serializer.validated_data.get('name')
            if new_name and 'slug' not in payload:
                base_slug = slugify(new_name) or 'genre'
                slug = base_slug
                counter = 2
                while Genre.objects.filter(slug=slug).exclude(pk=genre.pk).exists():
                    slug = f'{base_slug}-{counter}'
                    counter += 1
                genre = serializer.save(slug=slug)
            else:
                genre = serializer.save()

            # Recategorizing a genre keeps every song pointing at the same row,
            # so category moves are always lossless.
            AuditLog.objects.create(
                actor_username=request.user.username,
                action='GENRE_UPDATED',
                target_model='Genre',
                target_id=str(genre.id),
                details=request.data
            )
            return Response(GenreSerializer(genre).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            genre = Genre.objects.get(pk=pk)
        except Genre.DoesNotExist:
            return Response({'error': 'Genre not found'}, status=status.HTTP_404_NOT_FOUND)

        primary_count = Song.objects.filter(primary_genre=genre).count()
        secondary_count = genre.secondary_songs.count()

        if primary_count or secondary_count:
            reassign_to = request.query_params.get('reassign_to')
            if not reassign_to:
                return Response(
                    {
                        'error': (
                            f"Genre '{genre.name}' is still used by {primary_count} primary and "
                            f"{secondary_count} secondary song links. "
                            "Pass ?reassign_to=<genre_id> to move them before deleting."
                        ),
                        'primary_songs': primary_count,
                        'secondary_songs': secondary_count,
                    },
                    status=status.HTTP_409_CONFLICT
                )
            try:
                target = Genre.objects.get(pk=reassign_to)
            except (Genre.DoesNotExist, ValueError):
                return Response({'error': 'Reassign target genre not found'}, status=status.HTTP_400_BAD_REQUEST)
            if target.id == genre.id:
                return Response({'error': 'Cannot reassign a genre onto itself'}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                Song.objects.filter(primary_genre=genre).update(primary_genre=target)
                for song in genre.secondary_songs.all():
                    song.secondary_genres.remove(genre)
                    song.secondary_genres.add(target)
                genre.delete()
        else:
            genre.delete()

        AuditLog.objects.create(
            actor_username=request.user.username,
            action='GENRE_DELETED',
            target_model='Genre',
            target_id=str(pk),
            details={
                'name': genre.name,
                'reassigned_primary': primary_count,
                'reassigned_secondary': secondary_count,
            }
        )
        return Response({'message': f"Genre '{genre.name}' deleted."})


class AdminArtistManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        artists = Artist.objects.annotate(
            songs_count=Count('songs', distinct=True)
        ).order_by('display_name')

        search = (request.query_params.get('search') or '').strip()
        if search:
            artists = artists.filter(
                Q(display_name__icontains=search) | Q(display_name_ne__icontains=search)
            )

        verification = request.query_params.get('verification')
        if verification:
            artists = artists.filter(verification_status=verification)

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
            return Response(ArtistSerializer(artist).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminArtistDetailManagementView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            artist = Artist.objects.get(pk=pk)
        except Artist.DoesNotExist:
            return Response({'error': 'Artist not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ArtistSerializer(artist, data=request.data, partial=True)
        if serializer.is_valid():
            artist = serializer.save()
            AuditLog.objects.create(
                actor_username=request.user.username,
                action='ARTIST_UPDATED',
                target_model='Artist',
                target_id=str(artist.id),
                details=request.data
            )
            return Response(ArtistSerializer(artist).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            artist = Artist.objects.get(pk=pk)
        except Artist.DoesNotExist:
            return Response({'error': 'Artist not found'}, status=status.HTTP_404_NOT_FOUND)

        song_count = artist.songs.count()
        if song_count:
            reassign_to = request.query_params.get('reassign_to')
            if not reassign_to:
                return Response(
                    {
                        'error': (
                            f"Artist '{artist.display_name}' has {song_count} songs. "
                            "Pass ?reassign_to=<artist_id> to move them before deleting "
                            "(this is also how you merge two artists)."
                        ),
                        'songs': song_count,
                    },
                    status=status.HTTP_409_CONFLICT
                )
            try:
                target = Artist.objects.get(pk=reassign_to)
            except (Artist.DoesNotExist, ValueError):
                return Response({'error': 'Reassign target artist not found'}, status=status.HTTP_400_BAD_REQUEST)
            if target.id == artist.id:
                return Response({'error': 'Cannot reassign an artist onto themselves'}, status=status.HTTP_400_BAD_REQUEST)
            Song.objects.filter(artist=artist).update(artist=target)

        name = artist.display_name
        artist.delete()
        AuditLog.objects.create(
            actor_username=request.user.username,
            action='ARTIST_DELETED',
            target_model='Artist',
            target_id=str(pk),
            details={'display_name': name, 'reassigned_songs': song_count}
        )
        return Response({'message': f"Artist '{name}' deleted."})


class AdminStationManagementView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk=None):
        if pk:
            try:
                st = Station.objects.annotate(
                    songs_count=Count('station_songs', distinct=True)
                ).get(pk=pk)
                return Response(StationSerializer(st).data)
            except Station.DoesNotExist:
                return Response({'error': 'Station not found'}, status=status.HTTP_404_NOT_FOUND)
        stations = Station.objects.annotate(
            songs_count=Count('station_songs', distinct=True)
        ).order_by('display_order', 'title')
        return Response(StationSerializer(stations, many=True).data)

    def post(self, request):
        title = (request.data.get('title') or '').strip()
        if not title:
            return Response({'error': "'title' is required"}, status=status.HTTP_400_BAD_REQUEST)

        base_slug = slugify(request.data.get('slug') or title) or 'station'
        slug = base_slug
        counter = 2
        while Station.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1

        try:
            display_order = int(request.data.get('display_order') or 0)
        except (TypeError, ValueError):
            return Response({'error': 'display_order must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        station = Station.objects.create(
            slug=slug,
            title=title,
            title_ne=(request.data.get('title_ne') or '').strip(),
            tagline=(request.data.get('tagline') or '').strip(),
            tagline_ne=(request.data.get('tagline_ne') or '').strip(),
            description=request.data.get('description', ''),
            description_ne=request.data.get('description_ne', ''),
            cover_image=request.data.get('cover_image', ''),
            theme_color=request.data.get('theme_color') or '#C7A66A',
            ambient_type=request.data.get('ambient_type') or 'vintage_crackle',
            is_featured=bool(request.data.get('is_featured', True)),
            is_active=bool(request.data.get('is_active', True)),
            display_order=display_order,
        )

        AuditLog.objects.create(
            actor_username=request.user.username,
            action='STATION_CREATED',
            target_model='Station',
            target_id=str(station.id),
            details=StationSerializer(station).data,
        )
        return Response(StationSerializer(station).data, status=status.HTTP_201_CREATED)

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

    def delete(self, request, pk):
        try:
            st = Station.objects.get(pk=pk)
        except Station.DoesNotExist:
            return Response({'error': 'Station not found'}, status=status.HTTP_404_NOT_FOUND)

        link_count = st.station_songs.count()
        st.delete()
        AuditLog.objects.create(
            actor_username=request.user.username,
            action='STATION_DELETED',
            target_model='Station',
            target_id=str(pk),
            details={'title': st.title, 'station_links_removed': link_count},
        )
        return Response({
            'message': f"Station '{st.title}' deleted.",
            'station_links_removed': link_count,
        })


class AdminTakedownListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        reports = TakedownRequest.objects.select_related('song', 'song__artist').order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter and status_filter in dict(TakedownRequest.STATUS_CHOICES):
            reports = reports.filter(status=status_filter)

        reason = request.query_params.get('reason')
        if reason:
            reports = reports.filter(reason=reason)

        search = (request.query_params.get('search') or '').strip()
        if search:
            reports = reports.filter(
                Q(song__title__icontains=search)
                | Q(song__title_ne__icontains=search)
                | Q(song__artist__display_name__icontains=search)
                | Q(claimant_name__icontains=search)
                | Q(claimant_email__icontains=search)
            )

        serializer = TakedownRequestSerializer(reports, many=True)
        return Response({
            'count': len(serializer.data),
            'results': serializer.data,
            'available_statuses': [choice[0] for choice in TakedownRequest.STATUS_CHOICES],
        })


class PublicTakedownStatusView(APIView):
    """Let a reporter track their ticket with just the ticket id and email."""

    permission_classes = [AllowAny]

    def get(self, request, pk):
        email = (request.query_params.get('email') or '').strip().lower()
        try:
            report = TakedownRequest.objects.select_related('song', 'song__artist').get(pk=pk)
        except TakedownRequest.DoesNotExist:
            return Response({'error': 'Ticket not found'}, status=status.HTTP_404_NOT_FOUND)

        if email and report.claimant_email.lower() != email:
            return Response(
                {'error': 'Email does not match this ticket.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return Response({
            'ticket_id': report.id,
            'status': report.status,
            'reason': report.reason,
            'song_title': report.song.title,
            'artist_name': report.song.artist.display_name if report.song.artist else None,
            'resolution_notes': report.resolution_notes,
            'created_at': report.created_at,
            'resolved_at': report.resolved_at,
        })


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
