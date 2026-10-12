"""Admin endpoints to manage the ordered song queue of a station."""

from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLog, Song, Station, StationSong


class AdminStationQueueView(APIView):
    """GET list, POST add (idempotent), PATCH reorder, DELETE remove."""

    permission_classes = [IsAdminUser]

    def _station(self, pk):
        try:
            return Station.objects.get(pk=pk)
        except Station.DoesNotExist:
            return None

    def _serialize(self, station):
        links = station.station_songs.select_related('song', 'song__artist').order_by('position', 'id')
        rows = []
        for link in links:
            song = link.song
            artwork = song.artwork_url or (
                f'https://img.youtube.com/vi/{song.provider_video_id}/hqdefault.jpg'
                if song.provider_video_id else ''
            )
            rows.append({
                'position': link.position,
                'song_id': song.id,
                'title': song.title,
                'title_ne': song.title_ne,
                'artist_name': song.artist.display_name if song.artist else None,
                'publication_status': song.publication_status,
                'artwork_url': artwork,
            })
        return rows

    def get(self, request, pk):
        station = self._station(pk)
        if station is None:
            return Response({'error': 'Station not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'station_id': station.id,
            'station_title': station.title,
            'count': station.station_songs.count(),
            'queue': self._serialize(station),
        })

    def post(self, request, pk):
        station = self._station(pk)
        if station is None:
            return Response({'error': 'Station not found'}, status=status.HTTP_404_NOT_FOUND)

        song_ids = request.data.get('song_ids')
        if not song_ids:
            single = request.data.get('song_id') or request.data.get('song')
            song_ids = [single] if single else []
        try:
            song_ids = [int(sid) for sid in song_ids]
        except (TypeError, ValueError):
            return Response({'error': 'song_id(s) must be integers'}, status=status.HTTP_400_BAD_REQUEST)
        if not song_ids:
            return Response({'error': 'Provide song_id or song_ids'}, status=status.HTTP_400_BAD_REQUEST)

        next_position = (station.station_songs.order_by('-position').values_list('position', flat=True).first() or 0) + 1
        added, skipped = [], []
        with transaction.atomic():
            for song_id in song_ids:
                try:
                    song = Song.objects.get(pk=song_id)
                except Song.DoesNotExist:
                    skipped.append(song_id)
                    continue
                _, created = StationSong.objects.get_or_create(
                    station=station, song=song, defaults={'position': next_position},
                )
                if created:
                    added.append(song_id)
                    next_position += 1
                else:
                    skipped.append(song_id)

        if added:
            AuditLog.objects.create(
                actor_username=request.user.username,
                action='STATION_QUEUE_ADD',
                target_model='Station',
                target_id=str(station.id),
                details={'added': added, 'skipped': skipped},
            )
        code = status.HTTP_201_CREATED if added else status.HTTP_200_OK
        return Response({
            'message': f'Added {len(added)} song(s) to "{station.title}".',
            'added': added,
            'skipped': skipped,
            'queue': self._serialize(station),
        }, status=code)

    def patch(self, request, pk):
        station = self._station(pk)
        if station is None:
            return Response({'error': 'Station not found'}, status=status.HTTP_404_NOT_FOUND)

        order = request.data.get('order')
        if not isinstance(order, list):
            return Response({'error': "Send {'order': [song_id, ...]}"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            order = [int(sid) for sid in order]
        except (TypeError, ValueError):
            return Response({'error': 'order must be a list of integer song ids'}, status=status.HTTP_400_BAD_REQUEST)

        links = {link.song_id: link for link in station.station_songs.all()}
        with transaction.atomic():
            for position, song_id in enumerate(order):
                link = links.get(song_id)
                if link is not None and link.position != position:
                    link.position = position
                    link.save(update_fields=['position'])

        AuditLog.objects.create(
            actor_username=request.user.username,
            action='STATION_QUEUE_REORDER',
            target_model='Station',
            target_id=str(station.id),
            details={'order': order},
        )
        return Response({'message': 'Queue reordered.', 'queue': self._serialize(station)})

    def delete(self, request, pk):
        station = self._station(pk)
        if station is None:
            return Response({'error': 'Station not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            song_id = int(request.query_params.get('song'))
        except (TypeError, ValueError):
            return Response({'error': 'Provide ?song=<song_id>'}, status=status.HTTP_400_BAD_REQUEST)

        deleted, _ = StationSong.objects.filter(station=station, song_id=song_id).delete()
        if not deleted:
            return Response({'error': 'That song is not in this station queue.'}, status=status.HTTP_404_NOT_FOUND)

        for position, link in enumerate(station.station_songs.order_by('position', 'id')):
            if link.position != position:
                link.position = position
                link.save(update_fields=['position'])

        AuditLog.objects.create(
            actor_username=request.user.username,
            action='STATION_QUEUE_REMOVE',
            target_model='Station',
            target_id=str(station.id),
            details={'removed_song_id': song_id},
        )
        return Response({'message': 'Song removed from queue.', 'queue': self._serialize(station)})
