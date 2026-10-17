-- Bajeko Chiya Pasal — 0004_rls.sql
-- Lock every table down. The website never touches tables directly: all reads
-- and writes go through the SECURITY DEFINER RPCs in 0002/0003, which filter
-- by publication status and check the admins allowlist themselves.
--
-- With RLS enabled and zero policies, PostgREST's `anon` and `authenticated`
-- roles are denied everything, while Supabase's `service_role` (BYPASSRLS)
-- and the SQL editor keep full access for migrations and maintenance.

begin;

alter table public.genre_categories    enable row level security;
alter table public.genres              enable row level security;
alter table public.artists             enable row level security;
alter table public.songs               enable row level security;
alter table public.song_secondary_genres enable row level security;
alter table public.stations            enable row level security;
alter table public.station_songs       enable row level security;
alter table public.favorites           enable row level security;
alter table public.playback_events     enable row level security;
alter table public.takedown_requests   enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.admins              enable row level security;

commit;
