from django.urls import path
from .views import (
    StationListView, StationDetailView,
    SongListView, SongDetailView,
    ArtistListView, GenreListView, GenreCategoryListView, DecadesListView, LanguageListView,
    FeaturedContentView, FavoriteListView, PlaybackEventView,
    TakedownSubmitView,
    AdminStatsView, AdminSongManagementView, AdminSongBulkActionView,
    AdminArtistManagementView, AdminArtistDetailManagementView,
    AdminGenreManagementView, AdminGenreDetailManagementView,
    AdminGenreCategoryManagementView, AdminGenreCategoryDetailManagementView,
    AdminStationManagementView, AdminStationQueueView,
    AdminTakedownListView, AdminTakedownActionView, PublicTakedownStatusView,
    AdminAuditLogsView,
    AuthLoginView, AuthLogoutView, AuthUserView, AuthCsrfView, AuthChangePasswordView,
    AuthCaptchaView
)

urlpatterns = [
    # Public catalog
    path('stations/', StationListView.as_view(), name='station-list'),
    path('stations/<slug:slug>/', StationDetailView.as_view(), name='station-detail'),
    path('songs/', SongListView.as_view(), name='song-list'),
    path('songs/<int:pk>/', SongDetailView.as_view(), name='song-detail'),
    path('artists/', ArtistListView.as_view(), name='artist-list'),
    path('genres/', GenreListView.as_view(), name='genre-list'),
    path('genre-categories/', GenreCategoryListView.as_view(), name='genre-category-list'),
    path('decades/', DecadesListView.as_view(), name='decades-list'),
    path('languages/', LanguageListView.as_view(), name='languages-list'),
    path('featured/', FeaturedContentView.as_view(), name='featured-content'),
    path('favorites/', FavoriteListView.as_view(), name='favorite-list'),
    path('playback-events/', PlaybackEventView.as_view(), name='playback-events'),
    path('takedown-request/', TakedownSubmitView.as_view(), name='takedown-request'),
    path('takedown-request/<int:pk>/status/', PublicTakedownStatusView.as_view(), name='takedown-status'),

    # Auth
    path('auth/csrf/', AuthCsrfView.as_view(), name='auth-csrf'),
    path('auth/captcha/', AuthCaptchaView.as_view(), name='auth-captcha'),
    path('auth/login/', AuthLoginView.as_view(), name='auth-login'),
    path('auth/logout/', AuthLogoutView.as_view(), name='auth-logout'),
    path('auth/user/', AuthUserView.as_view(), name='auth-user'),
    path('auth/change-password/', AuthChangePasswordView.as_view(), name='auth-change-password'),

    # Admin protected
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/songs/', AdminSongManagementView.as_view(), name='admin-song-create'),
    path('admin/songs/bulk/', AdminSongBulkActionView.as_view(), name='admin-song-bulk'),
    path('admin/songs/<int:pk>/', AdminSongManagementView.as_view(), name='admin-song-manage'),
    path('admin/artists/', AdminArtistManagementView.as_view(), name='admin-artist-manage'),
    path('admin/artists/<int:pk>/', AdminArtistDetailManagementView.as_view(), name='admin-artist-detail-manage'),
    path('admin/genres/', AdminGenreManagementView.as_view(), name='admin-genre-manage'),
    path('admin/genres/<int:pk>/', AdminGenreDetailManagementView.as_view(), name='admin-genre-detail-manage'),
    path('admin/genre-categories/', AdminGenreCategoryManagementView.as_view(), name='admin-genre-category-manage'),
    path('admin/genre-categories/<int:pk>/', AdminGenreCategoryDetailManagementView.as_view(), name='admin-genre-category-detail-manage'),
    path('admin/stations/', AdminStationManagementView.as_view(), name='admin-station-manage'),
    path('admin/stations/<int:pk>/', AdminStationManagementView.as_view(), name='admin-station-detail-manage'),
    path('admin/stations/<int:pk>/queue/', AdminStationQueueView.as_view(), name='admin-station-queue'),
    path('admin/takedowns/', AdminTakedownListView.as_view(), name='admin-takedowns'),
    path('admin/takedowns/<int:pk>/action/', AdminTakedownActionView.as_view(), name='admin-takedown-action'),
    path('admin/audit-logs/', AdminAuditLogsView.as_view(), name='admin-audit-logs'),
]
