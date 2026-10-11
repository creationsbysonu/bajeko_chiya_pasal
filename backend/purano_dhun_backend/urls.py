from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        'name': 'Purano Dhun API',
        'nepali_name': 'पुरानो धुन',
        'version': '1.0.0',
        'status': 'healthy',
        'documentation': '/api/docs/',
        'endpoints': {
            'stations': '/api/stations/',
            'songs': '/api/songs/',
            'artists': '/api/artists/',
            'genres': '/api/genres/',
            'decades': '/api/decades/',
            'featured': '/api/featured/',
            'favorites': '/api/favorites/',
            'takedown_request': '/api/takedown-request/',
        }
    })

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/', include('radio_core.urls')),
]
