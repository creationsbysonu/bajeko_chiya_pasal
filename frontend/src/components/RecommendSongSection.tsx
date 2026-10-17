import React, { useEffect, useState } from 'react';
import { Reveal } from './motion/Reveal';
import { api } from '../services/api';
import { useI18n } from '../context/I18nContext';
import { FestivalCategory, Genre, SongRequestSummary } from '../types';
import {
  Send, CheckCircle2, Loader2, Link2, User, Mail, Tag, CalendarDays,
  ListMusic, Sparkles, Music2, AlertCircle, ChevronDown,
} from 'lucide-react';

/** Loose YouTube URL check that mirrors the server-side validation. */
const YOUTUBE_RE = /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  pending: { pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  under_review: { pill: 'bg-white/5 text-neutral-300 border-white/10', dot: 'bg-amber-400' },
  added: { pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  rejected: { pill: 'bg-white/5 text-neutral-400 border-white/10', dot: 'bg-neutral-500' },
};

export const RecommendSongSection: React.FC = () => {
  const { locale, t } = useI18n();
  const ne = locale === 'ne';
  const s = t.songRequest;

  const [festivals, setFestivals] = useState<FestivalCategory[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [recent, setRecent] = useState<SongRequestSummary[]>([]);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [festivalSlug, setFestivalSlug] = useState('');
  const [genreId, setGenreId] = useState('');
  const [note, setNote] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [cats, gens, feed] = await Promise.all([
        api.getFestivalCategories().catch(() => [] as FestivalCategory[]),
        api.getGenres().catch(() => [] as Genre[]),
        api.getRecentSongRequests(6),
      ]);
      if (!alive) return;
      setFestivals(cats);
      setGenres(gens);
      setRecent(feed);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const reset = () => {
    setTitle('');
    setArtist('');
    setYoutubeUrl('');
    setFestivalSlug('');
    setGenreId('');
    setNote('');
    setRequesterName('');
    setRequesterEmail('');
    setRequestId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(`${s.titleLabel}: ${ne ? 'आवश्यक छ' : 'required'}`);
      return;
    }
    if (!requesterName.trim()) {
      setError(`${s.nameLabel}: ${ne ? 'आवश्यक छ' : 'required'}`);
      return;
    }
    if (youtubeUrl.trim() && !YOUTUBE_RE.test(youtubeUrl.trim())) {
      setError(`${s.youtubeLabel}: ${ne ? 'मान्य युट्युब लिंक हाल्नुहोस्' : 'enter a valid YouTube link'}`);
      return;
    }
    if (requesterEmail.trim() && !EMAIL_RE.test(requesterEmail.trim())) {
      setError(`${s.emailLabel}: ${ne ? 'मान्य इमेल हाल्नुहोस्' : 'enter a valid email address'}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitSongRequest({
        title: title.trim(),
        artist: artist.trim(),
        youtube_url: youtubeUrl.trim(),
        festival_slug: festivalSlug,
        genre_id: genreId ? Number(genreId) : undefined,
        note: note.trim(),
        requester_name: requesterName.trim(),
        requester_email: requesterEmail.trim(),
      });
      setRequestId(res.request_id);
      api.getRecentSongRequests(6).then(setRecent).catch(() => {});
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      // Surface server validation/rate-limit wording verbatim when useful.
      if (message && (message.includes(': ') || message.includes('Too many'))) setError(message);
      else setError(s.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-red-500 focus:outline-none transition-colors duration-150 placeholder:text-neutral-600';
  const labelClass = 'block text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1.5';
  const iconWrap = 'absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none';
  const selectChevron = 'absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {/* Section header */}
      <Reveal variant="up" className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-[0.3em] mb-2">
          <ListMusic className="w-3.5 h-3.5 text-red-400" />
          <span>{ne ? 'श्रोताको सहभागिता' : 'Listener Contributions'}</span>
        </div>
        <h2 className="font-serif text-3xl font-black text-white">
          {ne ? s.titleNe : s.title}
        </h2>
        <p className="text-neutral-400 mt-3 max-w-2xl mx-auto text-sm leading-relaxed font-nepali">
          {ne ? s.subtitleNe : s.subtitle}
        </p>
      </Reveal>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <Reveal variant="up" delay={40} className="lg:col-span-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8 h-full">
            {requestId ? (
              <div className="text-center py-10 space-y-5">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 mx-auto flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{s.successTitle}</h3>
                <div className="inline-block px-4 py-2 bg-white/5 rounded-lg border border-white/10 font-mono text-sm text-neutral-300">
                  {s.successId}: #{requestId}
                </div>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto font-nepali">{s.successBody}</p>
                <button
                  onClick={reset}
                  className="mt-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
                >
                  {s.another}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-950/70 border border-red-500/40 text-red-300 rounded-xl text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>{s.titleLabel} *</label>
                    <div className="relative">
                      <Music2 className={`${iconWrap} w-4 h-4`} />
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={s.titlePlaceholder}
                        maxLength={300}
                        required
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{s.artistLabel}</label>
                    <div className="relative">
                      <User className={`${iconWrap} w-4 h-4`} />
                      <input
                        type="text"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder={s.artistPlaceholder}
                        maxLength={200}
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      {s.festivalLabel}
                    </label>
                    <div className="relative">
                      <CalendarDays className={`${iconWrap} w-4 h-4`} />
                      <select
                        value={festivalSlug}
                        onChange={(e) => setFestivalSlug(e.target.value)}
                        className={`${inputClass} pl-9 pr-9 appearance-none`}
                      >
                        <option value="" className="bg-black">{s.festivalAny}</option>
                        {festivals.map((f) => (
                          <option key={f.slug} value={f.slug} className="bg-black">
                            {ne ? f.name_ne || f.name : f.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className={selectChevron} />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      {s.youtubeLabel}
                      <span className="ml-2 text-neutral-600 normal-case tracking-normal">({s.emailOptional})</span>
                    </label>
                    <div className="relative">
                      <Link2 className={`${iconWrap} w-4 h-4`} />
                      <input
                        type="url"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder={s.youtubePlaceholder}
                        maxLength={500}
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-1 font-nepali">{s.youtubeHint}</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>{s.genreLabel}</label>
                    <div className="relative">
                      <Tag className={`${iconWrap} w-4 h-4`} />
                      <select
                        value={genreId}
                        onChange={(e) => setGenreId(e.target.value)}
                        className={`${inputClass} pl-9 pr-9 appearance-none`}
                      >
                        <option value="" className="bg-black">{s.genreAny}</option>
                        {genres.map((g) => (
                          <option key={g.id} value={g.id} className="bg-black">
                            {ne ? g.name_ne || g.name : g.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className={selectChevron} />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>{s.noteLabel}</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder={s.notePlaceholder}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{s.nameLabel} *</label>
                    <div className="relative">
                      <User className={`${iconWrap} w-4 h-4`} />
                      <input
                        type="text"
                        value={requesterName}
                        onChange={(e) => setRequesterName(e.target.value)}
                        placeholder={s.namePlaceholder}
                        maxLength={200}
                        required
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      {s.emailLabel}
                      <span className="ml-2 text-neutral-600 normal-case tracking-normal">({s.emailOptional})</span>
                    </label>
                    <div className="relative">
                      <Mail className={`${iconWrap} w-4 h-4`} />
                      <input
                        type="email"
                        value={requesterEmail}
                        onChange={(e) => setRequesterEmail(e.target.value)}
                        placeholder={s.emailPlaceholder}
                        maxLength={320}
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-600 font-nepali flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-red-400/70 flex-shrink-0" />
                  {s.consent}
                </p>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? s.submitting : s.submit}
                </button>
              </form>
            )}
          </div>
        </Reveal>

        {/* Recent suggestions */}
        <Reveal variant="up" delay={100} className="lg:col-span-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 h-full">
            <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-neutral-500 mb-4 flex items-center gap-2">
              <ListMusic className="w-3.5 h-3.5 text-red-400" />
              {s.recentTitle}
            </h3>

            {recent.length === 0 ? (
              <p className="text-sm text-neutral-500 font-nepali py-8 text-center">{s.recentEmpty}</p>
            ) : (
              <ul className="space-y-2.5">
                {recent.map((r) => {
                  const st = STATUS_STYLES[r.status] ?? STATUS_STYLES.pending;
                  const label =
                    r.status === 'added' ? s.statusAdded
                      : r.status === 'rejected' ? s.statusRejected
                        : r.status === 'under_review' ? s.statusUnderReview
                          : s.statusPending;
                  return (
                    <li
                      key={r.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/8"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-base flex-shrink-0">
                        {r.festival_emoji || '🎵'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate font-nepali">{r.title}</p>
                        {r.artist && <p className="text-xs text-neutral-500 truncate">{r.artist}</p>}
                        {r.festival_name && (
                          <p className="text-[11px] text-neutral-600 truncate">
                            {ne ? r.festival_name_ne || r.festival_name : r.festival_name}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border flex-shrink-0 ${st.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
