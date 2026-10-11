#!/bin/sh
# Entrypoint for the Purano Dhun backend container.
# Runs migrations + collectstatic, seeds the catalog when the DB is empty
# (or when SEED_CATALOG=true is forced), then execs the given command.
set -e

echo "==> Applying database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

# Optional admin bootstrap for hosts without a shell (e.g. Render free tier).
# Set DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL and
# DJANGO_SUPERUSER_PASSWORD. Skipped if the user already exists, so it is safe
# to leave set across restarts.
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "==> Ensuring admin user exists..."
    python manage.py createsuperuser --noinput >/dev/null 2>&1 || \
        echo "    (admin user already exists or could not be created; continuing)"
fi

# Decide whether to seed: forced by env, or automatically on an empty DB.
should_seed="${SEED_CATALOG:-}"
if [ -z "$should_seed" ]; then
    if python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'purano_dhun_backend.settings')
django.setup()
from radio_core.models import Station
raise SystemExit(0 if Station.objects.exists() else 1)
" 2>/dev/null; then
        should_seed=false
    else
        should_seed=true
    fi
fi

if [ "$should_seed" = "true" ]; then
    echo "==> Seeding catalog (empty database or SEED_CATALOG=true)..."
    python manage.py seed_catalog
else
    echo "==> Catalog already seeded, skipping."
fi

exec "$@"
