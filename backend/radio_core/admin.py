from django.contrib import admin
from .models import (
    Artist, Genre, GenreCategory, Song, Station, StationSong,
    Favorite, PlaybackEvent, TakedownRequest, AuditLog
)

@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'display_name_ne', 'verification_status', 'created_at')
    search_fields = ('display_name', 'display_name_ne')
    list_filter = ('verification_status',)


@admin.register(GenreCategory)
class GenreCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_ne', 'slug', 'display_order', 'is_active')
    search_fields = ('name', 'name_ne', 'slug')
    list_filter = ('is_active',)
    list_editable = ('display_order', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_ne', 'category', 'is_active')
    search_fields = ('name', 'name_ne')
    list_filter = ('category', 'is_active')
    prepopulated_fields = {'slug': ('name',)}


class StationSongInline(admin.TabularInline):
    model = StationSong
    extra = 1
    ordering = ('position',)


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'title_ne', 'artist', 'release_year',
        'language', 'metadata_verification_status', 'publication_status', 'play_count'
    )
    search_fields = ('title', 'title_ne', 'romanized_title', 'artist__display_name')
    list_filter = ('publication_status', 'metadata_verification_status', 'decade', 'language')
    raw_id_fields = ('artist',)


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ('title', 'title_ne', 'slug', 'theme_color', 'is_featured', 'is_active', 'display_order')
    list_filter = ('is_featured', 'is_active')
    search_fields = ('title', 'title_ne', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [StationSongInline]


@admin.register(TakedownRequest)
class TakedownRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'song', 'claimant_name', 'reason', 'status', 'created_at')
    list_filter = ('status', 'reason')
    search_fields = ('song__title', 'claimant_name', 'claimant_email')
    readonly_fields = ('created_at',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor_username', 'action', 'target_model', 'target_id')
    search_fields = ('actor_username', 'action', 'target_id')
    readonly_fields = ('timestamp', 'actor_username', 'action', 'target_model', 'target_id', 'details', 'ip_address')
