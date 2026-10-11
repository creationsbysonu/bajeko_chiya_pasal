from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()


class VerificationStatus(models.TextChoices):
    UNVERIFIED = 'unverified', 'Unverified'
    VERIFIED = 'verified', 'Verified'
    OFFICIAL = 'official', 'Official'


class PublicationStatus(models.TextChoices):
    PUBLISHED = 'published', 'Published'
    DRAFT = 'draft', 'Draft'
    DISPUTED = 'disputed', 'Disputed'
    TAKEN_DOWN = 'taken_down', 'Taken Down'


class Artist(models.Model):
    display_name = models.CharField(max_length=200, db_index=True)
    display_name_ne = models.CharField(max_length=200, blank=True)
    biography = models.TextField(blank=True)
    biography_ne = models.TextField(blank=True)
    profile_image = models.URLField(max_length=500, blank=True)
    verification_status = models.CharField(
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.UNVERIFIED,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_name']
        indexes = [
            models.Index(fields=['display_name']),
            models.Index(fields=['display_name_ne']),
        ]

    def __str__(self):
        return f"{self.display_name} ({self.display_name_ne})" if self.display_name_ne else self.display_name


class GenreCategory(models.TextChoices):
    CLASSICAL_TRADITIONAL = 'classical_traditional', 'Classical & Traditional'
    FOLK = 'folk', 'Folk & Lok Dohori'
    POPULAR = 'popular', 'Popular & Contemporary'
    REGIONAL = 'regional', 'Regional & Indigenous'
    SPECIAL = 'special', 'Festive & Seasonal'


class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)
    name_ne = models.CharField(max_length=100, blank=True)
    slug = models.SlugField(max_length=120, unique=True)
    category = models.CharField(
        max_length=30,
        choices=GenreCategory.choices,
        default=GenreCategory.POPULAR
    )
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.name_ne})" if self.name_ne else self.name


class Song(models.Model):
    title = models.CharField(max_length=250, db_index=True)
    title_ne = models.CharField(max_length=250, blank=True, db_index=True)
    romanized_title = models.CharField(max_length=250, blank=True, db_index=True)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='songs')
    featured_artists = models.CharField(max_length=250, blank=True)
    composer = models.CharField(max_length=200, blank=True)
    lyricist = models.CharField(max_length=200, blank=True)
    album = models.CharField(max_length=200, blank=True)
    film_or_source = models.CharField(max_length=200, blank=True)
    release_year = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    language = models.CharField(max_length=50, default='Nepali', db_index=True)
    
    primary_genre = models.ForeignKey(
        Genre,
        on_delete=models.SET_NULL,
        null=True,
        related_name='primary_songs'
    )
    secondary_genres = models.ManyToManyField(
        Genre,
        blank=True,
        related_name='secondary_songs'
    )
    mood_tags = models.JSONField(default=list, blank=True)
    decade = models.CharField(max_length=20, blank=True, db_index=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    artwork_url = models.URLField(max_length=500, blank=True)
    
    playback_provider = models.CharField(max_length=30, default='youtube')
    provider_video_id = models.CharField(max_length=100, db_index=True)
    provider_url = models.URLField(max_length=500, blank=True)
    source_url = models.URLField(max_length=500, blank=True)
    attribution = models.CharField(max_length=300, blank=True)
    
    metadata_verification_status = models.CharField(
        max_length=30,
        choices=[
            ('verified', 'Verified Official'),
            ('community_submitted', 'Community Submitted'),
            ('demo', 'Demonstration Catalog')
        ],
        default='demo',
        db_index=True
    )
    publication_status = models.CharField(
        max_length=20,
        choices=PublicationStatus.choices,
        default=PublicationStatus.PUBLISHED,
        db_index=True
    )
    play_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-release_year', 'title']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['title_ne']),
            models.Index(fields=['romanized_title']),
            models.Index(fields=['decade']),
            models.Index(fields=['language']),
            models.Index(fields=['publication_status']),
            models.Index(fields=['provider_video_id']),
        ]

    def save(self, *args, **kwargs):
        if self.release_year and not self.decade:
            decade_start = (self.release_year // 10) * 10
            self.decade = f"{decade_start}s"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.artist.display_name}"


class Station(models.Model):
    slug = models.SlugField(max_length=100, unique=True)
    title = models.CharField(max_length=150)
    title_ne = models.CharField(max_length=150, blank=True)
    tagline = models.CharField(max_length=250, blank=True)
    tagline_ne = models.CharField(max_length=250, blank=True)
    description = models.TextField(blank=True)
    description_ne = models.TextField(blank=True)
    cover_image = models.URLField(max_length=500, blank=True)
    theme_color = models.CharField(max_length=30, default='#C7A66A')
    ambient_type = models.CharField(max_length=50, default='vintage_crackle')
    is_featured = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'title']

    def __str__(self):
        return f"{self.title} ({self.title_ne})" if self.title_ne else self.title


class StationSong(models.Model):
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='station_songs')
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name='station_appearances')
    position = models.PositiveIntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position', 'id']
        unique_together = ('station', 'song')

    def __str__(self):
        return f"{self.station.title} -> {self.song.title} (#{self.position})"


class Favorite(models.Model):
    session_key = models.CharField(max_length=80, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='favorites')
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['session_key']),
        ]

    def __str__(self):
        return f"Fav: {self.song.title} by {self.session_key[:8]}"


class PlaybackEvent(models.Model):
    EVENT_TYPES = [
        ('start', 'Playback Started'),
        ('complete', 'Track Completed'),
        ('skip', 'Track Skipped'),
        ('error', 'Playback Error'),
    ]
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    song = models.ForeignKey(Song, on_delete=models.SET_NULL, null=True, related_name='playback_events')
    station = models.ForeignKey(Station, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=80, blank=True)
    error_message = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']


class TakedownRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('content_unpublished', 'Content Unpublished'),
        ('resolved_kept', 'Resolved - Kept'),
        ('rejected', 'Rejected'),
    ]
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name='takedown_requests')
    claimant_name = models.CharField(max_length=150)
    claimant_email = models.EmailField()
    reason = models.CharField(
        max_length=50,
        choices=[
            ('copyright', 'Copyright Infringement Notice'),
            ('broken_video', 'Broken or Unavailable Video'),
            ('wrong_metadata', 'Inaccurate Metadata'),
            ('other', 'Other Moderation Concern')
        ]
    )
    details = models.TextField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Takedown #{self.id} for {self.song.title} ({self.status})"


class AuditLog(models.Model):
    actor_username = models.CharField(max_length=150)
    action = models.CharField(max_length=100)
    target_model = models.CharField(max_length=100)
    target_id = models.CharField(max_length=50)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.actor_username}: {self.action} on {self.target_model}#{self.target_id}"
