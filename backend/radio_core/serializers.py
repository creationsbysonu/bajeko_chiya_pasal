from rest_framework import serializers
from .models import (
    Artist, Genre, GenreCategory, Song, Station, StationSong,
    Favorite, PlaybackEvent, TakedownRequest, AuditLog
)


class GenreCategorySerializer(serializers.ModelSerializer):
    """Dynamic genre category registry (create/rename/reorder/delete from admin)."""

    genres_count = serializers.IntegerField(read_only=True, default=0)
    songs_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = GenreCategory
        fields = [
            'id', 'slug', 'name', 'name_ne', 'description',
            'display_order', 'is_active', 'genres_count', 'songs_count',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class GenreSerializer(serializers.ModelSerializer):
    songs_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Genre
        fields = [
            'id', 'name', 'name_ne', 'slug', 'category',
            'description', 'is_active', 'songs_count'
        ]
        extra_kwargs = {
            # Slug is auto-generated from the name by the admin endpoints.
            'slug': {'required': False},
        }


class ArtistSerializer(serializers.ModelSerializer):
    songs_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Artist
        fields = [
            'id', 'display_name', 'display_name_ne', 'biography',
            'biography_ne', 'profile_image', 'verification_status',
            'songs_count', 'created_at'
        ]


class SongSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.display_name', read_only=True)
    artist_name_ne = serializers.CharField(source='artist.display_name_ne', read_only=True)
    primary_genre_name = serializers.CharField(source='primary_genre.name', read_only=True)
    primary_genre_name_ne = serializers.CharField(source='primary_genre.name_ne', read_only=True)
    primary_genre_category = serializers.CharField(source='primary_genre.category', read_only=True, default='')
    secondary_genres = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Genre.objects.all(),
        required=False,
    )
    secondary_genre_names = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = [
            'id', 'title', 'title_ne', 'romanized_title',
            'artist', 'artist_name', 'artist_name_ne',
            'featured_artists', 'composer', 'lyricist',
            'album', 'film_or_source', 'release_year', 'language',
            'primary_genre', 'primary_genre_name', 'primary_genre_name_ne',
            'primary_genre_category', 'secondary_genres', 'secondary_genre_names',
            'mood_tags', 'decade', 'duration_seconds', 'artwork_url',
            'playback_provider', 'provider_video_id', 'provider_url',
            'source_url', 'attribution',
            'metadata_verification_status', 'publication_status',
            'play_count', 'is_featured', 'featured_order', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'play_count']

    def get_secondary_genre_names(self, obj):
        return [genre.name for genre in obj.secondary_genres.all()]

    def validate(self, attrs):
        """Keep the primary genre out of the secondary genre list."""
        attrs = super().validate(attrs)
        primary = attrs.get('primary_genre', getattr(self.instance, 'primary_genre', None))
        secondary = attrs.get('secondary_genres')
        if secondary is not None and primary is not None:
            attrs['secondary_genres'] = [genre for genre in secondary if genre.id != primary.id]
        return attrs


class StationSongSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)

    class Meta:
        model = StationSong
        fields = ['id', 'position', 'song']


class StationSerializer(serializers.ModelSerializer):
    songs_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Station
        fields = [
            'id', 'slug', 'title', 'title_ne', 'tagline', 'tagline_ne',
            'description', 'description_ne', 'cover_image',
            'theme_color', 'ambient_type', 'is_featured', 'is_active',
            'display_order', 'songs_count'
        ]


class StationDetailSerializer(serializers.ModelSerializer):
    station_songs = serializers.SerializerMethodField()

    class Meta:
        model = Station
        fields = [
            'id', 'slug', 'title', 'title_ne', 'tagline', 'tagline_ne',
            'description', 'description_ne', 'cover_image',
            'theme_color', 'ambient_type', 'is_featured',
            'station_songs'
        ]

    def get_station_songs(self, obj):
        active_songs = obj.station_songs.filter(
            song__publication_status='published'
        ).select_related('song', 'song__artist', 'song__primary_genre').order_by('position')
        return StationSongSerializer(active_songs, many=True).data


class FavoriteSerializer(serializers.ModelSerializer):
    song = SongSerializer(read_only=True)
    song_id = serializers.PrimaryKeyRelatedField(
        queryset=Song.objects.filter(publication_status='published'),
        write_only=True,
        source='song'
    )

    class Meta:
        model = Favorite
        fields = ['id', 'session_key', 'song', 'song_id', 'created_at']
        read_only_fields = ['id', 'created_at']


class PlaybackEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaybackEvent
        fields = ['id', 'event_type', 'song', 'station', 'session_id', 'error_message', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class TakedownRequestSerializer(serializers.ModelSerializer):
    song_title = serializers.CharField(source='song.title', read_only=True)
    artist_name = serializers.CharField(source='song.artist.display_name', read_only=True)

    class Meta:
        model = TakedownRequest
        fields = [
            'id', 'song', 'song_title', 'artist_name',
            'claimant_name', 'claimant_email', 'reason',
            'details', 'status', 'resolution_notes',
            'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'status', 'resolution_notes', 'created_at', 'resolved_at']


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'actor_username', 'action', 'target_model', 'target_id', 'details', 'timestamp']
        read_only_fields = ['id', 'timestamp']
