from django.urls import path
from .views import (
    StationListView, StationDetailView,
    SongListView, SongDetailView,
    ArtistListView, GenreListView, DecadesListView, LanguageListView,
    FeaturedContentView, FavoriteListView, PlaybackEventView,
    TakedownSubmitView,
    AdminStatsView, AdminSongManagementView,
    AdminArtistManagementView, AdminStationManagementView,
    AdminTakedownListView, AdminTakedownActionView,
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
    path('decades/', DecadesListView.as_view(), name='decades-list'),
    path('languages/', LanguageListView.as_view(), name='languages-list'),
    path('featured/', FeaturedContentView.as_view(), name='featured-content'),
    path('favorites/', FavoriteListView.as_view(), name='favorite-list'),
    path('playback-events/', PlaybackEventView.as_view(), name='playback-events'),
    path('takedown-request/', TakedownSubmitView.as_view(), name='takedown-request'),

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
    path('admin/songs/<int:pk>/', AdminSongManagementView.as_view(), name='admin-song-manage'),
    path('admin/artists/', AdminArtistManagementView.as_view(), name='admin-artist-manage'),
    path('admin/stations/', AdminStationManagementView.as_view(), name='admin-station-manage'),
    path('admin/stations/<int:pk>/', AdminStationManagementView.as_view(), name='admin-station-detail-manage'),
    path('admin/takedowns/', AdminTakedownListView.as_view(), name='admin-takedowns'),
    path('admin/takedowns/<int:pk>/action/', AdminTakedownActionView.as_view(), name='admin-takedown-action'),
    path('admin/audit-logs/', AdminAuditLogsView.as_view(), name='admin-audit-logs'),
]
