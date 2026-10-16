#!/usr/bin/env python3
"""Export the dev SQLite catalog into supabase/seed.sql.

Run from the repo root against the legacy dev catalog backup
(legacy-dev-catalog.sqlite3, git-ignored):

    python3 supabase/tools/generate_seed.py [path/to/catalog.sqlite3]

Writes supabase/seed.sql with explicit ids so foreign keys stay intact.
Runtime-only tables (favorites, playback_events, takedown_requests,
audit_logs, admins) are intentionally not seeded.
"""

import json
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "legacy-dev-catalog.sqlite3"
OUT = ROOT / "supabase" / "seed.sql"


def q(value) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, bytes):
        value = value.decode("utf-8", errors="replace")
    text = str(value).replace("'", "''")
    return f"'{text}'"


def main() -> int:
    if not DB.exists():
        print(f"error: {DB} not found", file=sys.stderr)
        return 1

    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    lines = [
        "-- Purano Dhun — seed.sql",
        "-- Generated from the legacy dev catalog (backend/db.sqlite3) by",
        "-- supabase/tools/generate_seed.py. Safe to re-run only on an empty",
        "-- database; ids are pinned so foreign keys line up.",
        "",
        "begin;",
        "",
    ]

    # Preserve original created_at timestamps where the schema has them.
    def ts(row, col):
        if col not in row.keys() or row[col] in (None, ""):
            return None
        try:
            return datetime.fromisoformat(str(row[col]).replace("Z", "+00:00"))
        except ValueError:
            return None

    def lit_ts(row, col):
        value = ts(row, col)
        return q(value.isoformat()) if value else "null"

    categories = cur.execute(
        "select * from radio_core_genrecategory order by id"
    ).fetchall()
    lines.append("insert into public.genre_categories (id, slug, name, name_ne, description, display_order, is_active, created_at) values")
    lines.append(",\n".join(
        f"({r['id']}, {q(r['slug'])}, {q(r['name'])}, {q(r['name_ne'])}, {q(r['description'])}, "
        f"{r['display_order']}, {'true' if r['is_active'] else 'false'}, {lit_ts(r, 'created_at')})"
        for r in categories
    ) + ";")
    lines.append(
        "select setval(pg_get_serial_sequence('public.genre_categories', 'id'), "
        f"(select max(id) from public.genre_categories));"
    )
    lines.append("")

    genres = cur.execute("select * from radio_core_genre order by id").fetchall()
    lines.append("insert into public.genres (id, name, name_ne, slug, category, description, is_active, created_at) values")
    lines.append(",\n".join(
        f"({r['id']}, {q(r['name'])}, {q(r['name_ne'])}, {q(r['slug'])}, {q(r['category'])}, "
        f"{q(r['description'])}, {'true' if r['is_active'] else 'false'}, {lit_ts(r, 'created_at')})"
        for r in genres
    ) + ";")
    lines.append(
        "select setval(pg_get_serial_sequence('public.genres', 'id'), "
        "(select max(id) from public.genres));"
    )
    lines.append("")

    artists = cur.execute("select * from radio_core_artist order by id").fetchall()
    lines.append(
        "insert into public.artists (id, display_name, display_name_ne, biography, biography_ne, "
        "profile_image, verification_status, created_at, updated_at) values"
    )
    lines.append(",\n".join(
        f"({r['id']}, {q(r['display_name'])}, {q(r['display_name_ne'])}, {q(r['biography'])}, "
        f"{q(r['biography_ne'])}, {q(r['profile_image'])}, {q(r['verification_status'])}, "
        f"{lit_ts(r, 'created_at')}, {lit_ts(r, 'updated_at')})"
        for r in artists
    ) + ";")
    lines.append(
        "select setval(pg_get_serial_sequence('public.artists', 'id'), "
        "(select max(id) from public.artists));"
    )
    lines.append("")

    songs = cur.execute("select * from radio_core_song order by id").fetchall()
    lines.append(
        "insert into public.songs (id, title, title_ne, romanized_title, artist_id, featured_artists, "
        "composer, lyricist, album, film_or_source, release_year, language, primary_genre_id, mood_tags, "
        "decade, duration_seconds, artwork_url, playback_provider, provider_video_id, provider_url, "
        "source_url, attribution, metadata_verification_status, publication_status, play_count, "
        "is_featured, featured_order, created_at, updated_at) values"
    )
    song_lines = []
    for r in songs:
        mood = r["mood_tags"]
        if isinstance(mood, (str, bytes)):
            mood = mood.decode() if isinstance(mood, bytes) else mood
            try:
                json.loads(mood)
            except ValueError:
                mood = "[]"
        mood_sql = q(mood) if mood else "'[]'"
        song_lines.append(
            f"({r['id']}, {q(r['title'])}, {q(r['title_ne'])}, {q(r['romanized_title'])}, {r['artist_id']}, "
            f"{q(r['featured_artists'])}, {q(r['composer'])}, {q(r['lyricist'])}, {q(r['album'])}, "
            f"{q(r['film_or_source'])}, {r['release_year'] if r['release_year'] is not None else 'null'}, "
            f"{q(r['language'])}, "
            f"{r['primary_genre_id'] if r['primary_genre_id'] is not None else 'null'}, "
            f"{mood_sql}::jsonb, {q(r['decade'])}, "
            f"{r['duration_seconds'] if r['duration_seconds'] is not None else 'null'}, "
            f"{q(r['artwork_url'])}, {q(r['playback_provider'])}, {q(r['provider_video_id'])}, "
            f"{q(r['provider_url'])}, {q(r['source_url'])}, {q(r['attribution'])}, "
            f"{q(r['metadata_verification_status'])}, {q(r['publication_status'])}, {r['play_count']}, "
            f"{'true' if r['is_featured'] else 'false'}, {r['featured_order']}, "
            f"{lit_ts(r, 'created_at')}, {lit_ts(r, 'updated_at')})"
        )
    lines.append(",\n".join(song_lines) + ";")
    lines.append(
        "select setval(pg_get_serial_sequence('public.songs', 'id'), "
        "(select max(id) from public.songs));"
    )
    lines.append("")

    secondary = cur.execute(
        "select song_id, genre_id from radio_core_song_secondary_genres order by song_id, genre_id"
    ).fetchall()
    if secondary:
        lines.append(
            "insert into public.song_secondary_genres (song_id, genre_id) values"
        )
        lines.append(",\n".join(
            f"({r['song_id']}, {r['genre_id']})" for r in secondary
        ) + ";")
        lines.append("")

    stations = cur.execute("select * from radio_core_station order by id").fetchall()
    lines.append(
        "insert into public.stations (id, slug, title, title_ne, tagline, tagline_ne, description, "
        "description_ne, cover_image, theme_color, ambient_type, is_featured, is_active, display_order, "
        "created_at, updated_at) values"
    )
    lines.append(",\n".join(
        f"({r['id']}, {q(r['slug'])}, {q(r['title'])}, {q(r['title_ne'])}, {q(r['tagline'])}, "
        f"{q(r['tagline_ne'])}, {q(r['description'])}, {q(r['description_ne'])}, {q(r['cover_image'])}, "
        f"{q(r['theme_color'])}, {q(r['ambient_type'])}, {'true' if r['is_featured'] else 'false'}, "
        f"{'true' if r['is_active'] else 'false'}, {r['display_order']}, "
        f"{lit_ts(r, 'created_at')}, {lit_ts(r, 'updated_at')})"
        for r in stations
    ) + ";")
    lines.append(
        "select setval(pg_get_serial_sequence('public.stations', 'id'), "
        "(select max(id) from public.stations));"
    )
    lines.append("")

    links = cur.execute(
        "select station_id, song_id, position from radio_core_stationsong order by station_id, position, id"
    ).fetchall()
    if links:
        lines.append("insert into public.station_songs (station_id, song_id, position) values")
        lines.append(",\n".join(
            f"({r['station_id']}, {r['song_id']}, {r['position']})" for r in links
        ) + ";")
        lines.append("")

    lines.append("commit;")
    lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT} "
          f"({len(categories)} categories, {len(genres)} genres, {len(artists)} artists, "
          f"{len(songs)} songs, {len(secondary)} secondary links, "
          f"{len(stations)} stations, {len(links)} station links)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
