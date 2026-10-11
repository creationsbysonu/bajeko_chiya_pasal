# Purano Dhun — Django backend image (dev + prod)
# Dev compose overrides CMD with `runserver`; prod uses gunicorn.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps kept minimal; psycopg installs from a binary wheel.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

# Invoked via `sh` so bind mounts in the dev stack can't break the exec bit
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
# PaaS platforms (Render etc.) inject $PORT and expect the app to bind it;
# local docker-compose keeps the default 8000.
CMD ["sh", "-c", "gunicorn purano_dhun_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${GUNICORN_WORKERS:-2} --access-logfile -"]
