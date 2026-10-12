"""Admin endpoints for the dynamic genre category registry.

Categories used to be a hardcoded ``GenreCategory`` TextChoices enum, so the only
way to add or rename one was a code change. They are now database rows, which
lets the admin portal create, rename, reorder, hide and delete them; genres
simply point at a category slug.
"""

from django.db import transaction
from django.db.models import Count
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLog, Genre, GenreCategory, Song, category_slug, ensure_default_genre_categories
from .serializers import GenreCategorySerializer


def category_registry():
    """Return the live registry, seeding the shipped defaults when empty."""
    return list(ensure_default_genre_categories())


def validate_genre_category(value):
    """Category check that raises ValueError instead of Django's ValidationError."""
    normalized = category_slug(value)
    known = {category.slug for category in category_registry()}
    if normalized not in known:
        raise ValueError(
            f"Unknown genre category '{value}'. Known categories: {', '.join(sorted(known))}. "
            'Create it under the admin Taxonomy tab first.'
        )
    return normalized


def category_counts():
    genre_counts = {
        row['category']: row['total']
        for row in Genre.objects.values('category').annotate(total=Count('id'))
    }
    song_counts = {
        row['primary_genre__category']: row['total']
        for row in Song.objects.filter(primary_genre__isnull=False)
        .values('primary_genre__category').annotate(total=Count('id'))
    }
    return genre_counts, song_counts


def category_payload(category, genre_counts, song_counts):
    return {
        **GenreCategorySerializer(category).data,
        'genres_count': genre_counts.get(category.slug, 0),
        'songs_count': song_counts.get(category.slug, 0),
    }


class AdminGenreCategoryManagementView(APIView):
    """List, create and reorder the genre categories themselves."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        genre_counts, song_counts = category_counts()
        registry = category_registry()
        if request.query_params.get('include_inactive') != 'true':
            registry = [category for category in registry if category.is_active]
        return Response([category_payload(c, genre_counts, song_counts) for c in registry])

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'error': "'name' is required"}, status=status.HTTP_400_BAD_REQUEST)
        if GenreCategory.objects.filter(name__iexact=name).exists():
            return Response(
                {'error': f"A category named '{name}' already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        slug = category_slug(request.data.get('slug') or name)
        if not slug:
            return Response(
                {'error': 'Category slug could not be derived from the name'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if GenreCategory.objects.filter(slug=slug).exists():
            return Response(
                {'error': f"Category slug '{slug}' already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            display_order = int(request.data.get('display_order') or 0)
        except (TypeError, ValueError):
            return Response(
                {'error': 'display_order must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        category = GenreCategory.objects.create(
            slug=slug,
            name=name,
            name_ne=(request.data.get('name_ne') or '').strip(),
            description=(request.data.get('description') or '').strip(),
            display_order=display_order,
            is_active=bool(request.data.get('is_active', True)),
        )

        AuditLog.objects.create(
            actor_username=request.user.username,
            action='GENRE_CATEGORY_CREATED',
            target_model='GenreCategory',
            target_id=str(category.id),
            details=GenreCategorySerializer(category).data,
        )
        return Response(GenreCategorySerializer(category).data, status=status.HTTP_201_CREATED)

    def put(self, request):
        """Persist a full ordering: [{'id': 1, 'display_order': 0}, ...]."""
        order = request.data.get('order')
        if not isinstance(order, list):
            return Response(
                {'error': "Send {'order': [{'id': 1, 'display_order': 0}, ...]}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        by_id = {category.id: category for category in category_registry()}
        updated = []
        with transaction.atomic():
            for entry in order:
                try:
                    category = by_id[int(entry['id'])]
                    category.display_order = int(entry['display_order'])
                    category.save(update_fields=['display_order'])
                    updated.append(category.id)
                except (KeyError, TypeError, ValueError):
                    return Response(
                        {'error': f'Invalid order entry: {entry}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

        AuditLog.objects.create(
            actor_username=request.user.username,
            action='GENRE_CATEGORY_REORDERED',
            target_model='GenreCategory',
            target_id=','.join(str(i) for i in updated),
            details={'order': order},
        )
        return Response({'message': f'Reordered {len(updated)} categories.', 'updated': updated})


class AdminGenreCategoryDetailManagementView(APIView):
    """Rename, reorder, hide or delete a single genre category."""

    permission_classes = [IsAdminUser]

    def _get(self, pk):
        try:
            return GenreCategory.objects.get(pk=pk), None
        except (GenreCategory.DoesNotExist, ValueError, TypeError):
            return None, Response(
                {'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request, pk):
        category, error = self._get(pk)
        if error:
            return error

        payload = dict(request.data)

        if 'name' in payload:
            name = (payload['name'] or '').strip()
            if not name:
                return Response(
                    {'error': "'name' cannot be empty"}, status=status.HTTP_400_BAD_REQUEST
                )
            if GenreCategory.objects.filter(name__iexact=name).exclude(pk=category.pk).exists():
                return Response(
                    {'error': f"A category named '{name}' already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            payload['name'] = name

        if 'slug' in payload:
            slug = category_slug(payload['slug'])
            if not slug:
                return Response(
                    {'error': 'Category slug cannot be empty'}, status=status.HTTP_400_BAD_REQUEST
                )
            if GenreCategory.objects.filter(slug=slug).exclude(pk=category.pk).exists():
                return Response(
                    {'error': f"Category slug '{slug}' already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            payload['slug'] = slug

        if 'display_order' in payload:
            try:
                payload['display_order'] = int(payload['display_order'])
            except (TypeError, ValueError):
                return Response(
                    {'error': 'display_order must be an integer'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        old_slug = category.slug
        serializer = GenreCategorySerializer(category, data=payload, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        category = serializer.save()
        # A renamed slug must follow the genres that live in it.
        if category.slug != old_slug:
            Genre.objects.filter(category=old_slug).update(category=category.slug)

        AuditLog.objects.create(
            actor_username=request.user.username,
            action='GENRE_CATEGORY_UPDATED',
            target_model='GenreCategory',
            target_id=str(category.id),
            details={**request.data, 'old_slug': old_slug},
        )
        return Response(GenreCategorySerializer(category).data)

    def delete(self, request, pk):
        category, error = self._get(pk)
        if error:
            return error

        genre_count = Genre.objects.filter(category=category.slug).count()
        registry = [c for c in category_registry() if c.pk != category.pk]
        if not registry:
            return Response(
                {'error': 'At least one genre category must remain.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if genre_count:
            target = next(
                (c for c in registry if c.slug == category_slug(request.query_params.get('reassign_to'))),
                None,
            )
            if target is None:
                return Response(
                    {
                        'error': (
                            f"Category '{category.name}' still holds {genre_count} genre(s). "
                            'Pass ?reassign_to=<category_slug> to move them first. '
                            f"Options: {', '.join(c.slug for c in registry)}"
                        ),
                        'genres': genre_count,
                        'available_targets': [c.slug for c in registry],
                    },
                    status=status.HTTP_409_CONFLICT
                )
            with transaction.atomic():
                Genre.objects.filter(category=category.slug).update(category=target.slug)
                category.delete()
        else:
            category.delete()

        AuditLog.objects.create(
            actor_username=request.user.username,
            action='GENRE_CATEGORY_DELETED',
            target_model='GenreCategory',
            target_id=str(pk),
            details={
                'name': category.name,
                'slug': category.slug,
                'genres_moved': genre_count,
                'reassigned_to': request.query_params.get('reassign_to'),
            },
        )
        return Response(
            {'message': f"Category '{category.name}' deleted.", 'genres_moved': genre_count}
        )
