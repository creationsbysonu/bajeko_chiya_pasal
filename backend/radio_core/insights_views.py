"""Admin analytics: plays, skips, favorites, trending, and broken videos.

All figures are derived from the PlaybackEvent and Favorite rows the site
already records, so there is no extra tracking to enable.
"""

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Favorite, PlaybackEvent, Song, Station


class AdminInsightsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            days = max(1, min(int(request.query_params.get('days', 30)), 365))
        except (TypeError, ValueError):
            days = 30
        since = timezone.now() - timedelta(days=days)

        events = PlaybackEvent.objects.filter(timestamp__gte=since)

        # Event totals for the window
        event_breakdown = {
            row['event_type']: row['total']
            for row in events.values('event_type').annotate(total=Count('id'))
        }
        total_events = sum(event_breakdown.values())
        starts = event_breakdown.get('start', 0)
        completes = event_breakdown.get('complete', 0)
        skips = event_breakdown.get('skip', 0)
        errors = event_breakdown.get('error', 0)
        completion_rate = round((completes / starts) * 100, 1) if starts else 0.0

        # Top songs by playback events in the window
        top_songs = [
            {
                'song_id': row['song__id'],
                'title': row['song__title'],
                'artist_name': row['song__artist__display_name'],
                'events': row['events'],
            }
            for row in events.filter(song__isnull=False)
            .values('song__id', 'song__title', 'song__artist__display_name')
            .annotate(events=Count('id')).order_by('-events')[:10]
        ]

        # All-time most played (uses the denormalised play_count on Song)
        most_played = [
            {
                'song_id': song.id,
                'title': song.title,
                'artist_name': song.artist.display_name if song.artist else None,
                'play_count': song.play_count,
            }
            for song in Song.objects.select_related('artist').order_by('-play_count')[:10]
        ]

        # Most favorited songs (all time)
        most_favorited = [
            {
                'song_id': row['song__id'],
                'title': row['song__title'],
                'artist_name': row['song__artist__display_name'],
                'favorites': row['favorites'],
            }
            for row in Favorite.objects.filter(song__isnull=False)
            .values('song__id', 'song__title', 'song__artist__display_name')
            .annotate(favorites=Count('id')).order_by('-favorites')[:10]
        ]

        # Top stations by playback events in the window
        top_stations = [
            {
                'station_id': row['station__id'],
                'title': row['station__title'],
                'events': row['events'],
            }
            for row in events.filter(station__isnull=False)
            .values('station__id', 'station__title')
            .annotate(events=Count('id')).order_by('-events')[:10]
        ]

        # Recent playback errors (likely broken videos)
        error_events = [
            {
                'id': event.id,
                'song_id': event.song_id,
                'song_title': event.song.title if event.song else None,
                'message': event.error_message,
                'timestamp': event.timestamp,
            }
            for event in events.filter(event_type='error', song__isnull=False)
            .select_related('song').order_by('-timestamp')[:20]
        ]

        # Distinct listeners (sessions) in the window
        unique_sessions = events.exclude(session_id='').values('session_id').distinct().count()
        total_favorites = Favorite.objects.count()

        return Response({
            'window_days': days,
            'total_events': total_events,
            'event_breakdown': event_breakdown,
            'starts': starts,
            'completes': completes,
            'skips': skips,
            'errors': errors,
            'completion_rate': completion_rate,
            'unique_sessions': unique_sessions,
            'total_favorites': total_favorites,
            'top_songs': top_songs,
            'most_played': most_played,
            'most_favorited': most_favorited,
            'top_stations': top_stations,
            'error_events': error_events,
        })
