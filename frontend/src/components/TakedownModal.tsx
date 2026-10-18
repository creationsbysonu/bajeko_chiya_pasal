import React, { useRef, useState } from 'react';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { useDialog } from '../hooks/useDialog';
import { api } from '../services/api';
import { Song } from '../types';

interface TakedownModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSong?: Song | null;
  songsList?: Song[];
}

export const TakedownModal: React.FC<TakedownModalProps> = ({
  isOpen,
  onClose,
  targetSong,
  songsList = [],
}) => {
  const { t } = useI18n();
  // 0 = "nothing picked yet"; the real id is derived from targetSong/the
  // list on every render (never a guessed fallback like song 1).
  const [songId, setSongId] = useState<number>(0);
  const [claimantName, setClaimantName] = useState('');
  const [claimantEmail, setClaimantEmail] = useState('');
  const [reason, setReason] = useState('copyright');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  const resetAndClose = () => {
    setTicketId(null);
    setClaimantName('');
    setClaimantEmail('');
    setDetails('');
    setErrorMessage(null);
    onClose();
  };

  // Escape, focus trap, focus restore, scroll lock.
  useDialog(isOpen, resetAndClose, dialogRef);

  // The song list arrives asynchronously (the modal mounts before the catalog
  // loads) and `targetSong` can change between openings, so the selection is
  // *derived* each render rather than copied into state once. Otherwise the
  // picker freezes on whatever id existed at first render and the ticket gets
  // filed against the wrong track — or against a song that isn't listed.
  const chosenSongId = targetSong
    ? targetSong.id
    : songsList.some((s) => s.id === songId)
      ? songId
      : (songsList[0]?.id ?? 0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenSongId) {
      setErrorMessage('No song selected — load the catalog and try again. / गीत छान्नुहोस्।');
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.submitTakedown({
        song: chosenSongId,
        claimant_name: claimantName,
        claimant_email: claimantEmail,
        reason,
        details,
      });
      setTicketId(res.ticket_id);
    } catch {
      setErrorMessage('Could not submit report. Please check your network and inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-red-500 focus:outline-none transition-colors duration-150 placeholder:text-neutral-600';
  const labelClass = 'block text-xs font-mono text-neutral-500 uppercase tracking-widest mb-1';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pd-veil"
      onMouseDown={resetAndClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="takedown-dialog-title"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-black border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto focus:outline-none"
      >
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-2 -m-1 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-red-950/80 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <h3 id="takedown-dialog-title" className="text-base font-semibold text-white">{t.takedown.title}</h3>
            <p className="text-xs text-neutral-500 font-mono tracking-wider">
              CONTENT GOVERNANCE & REMOVAL
            </p>
          </div>
        </div>

        {ticketId ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/60 mx-auto flex items-center justify-center border border-red-500/30">
              <CheckCircle2 className="w-6 h-6 text-red-500" />
            </div>
            <h4 className="text-lg font-semibold text-white">{t.takedown.success}</h4>
            <div className="inline-block px-4 py-2 bg-white/5 rounded-lg border border-white/10 font-mono text-sm text-neutral-300">
              Ticket ID: #{ticketId}
            </div>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto font-nepali">
              हाम्रो प्रशासक टोलीले तपाईंको सूचना अनुसार भिडियो इम्बेड वा विवरणको समीक्षा गर्नेछ।
            </p>
            <button
              onClick={resetAndClose}
              className="mt-4 px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-colors"
            >
              Done / बन्द गर्नुहोस्
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-neutral-500 font-nepali leading-relaxed">
              {t.takedown.description}
            </p>

            {errorMessage && (
              <div className="p-3 bg-red-950/80 border border-red-500/40 text-red-300 rounded-lg text-xs">
                {errorMessage}
              </div>
            )}

            {/* Song selection */}
            <div>
              <label htmlFor="takedown-song" className={labelClass}>Target Song (सम्बन्धित गीत)</label>
              {targetSong ? (
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-300">
                  {targetSong.title} — {targetSong.artist_name}
                </div>
              ) : songsList.length === 0 ? (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-nepali">
                  गीतको सूची लोड हुन सकेन। रिपोर्ट पठाउनु अघि पृष्ठ रिफ्रेस गर्नुहोस्।
                  <br />
                  <span className="font-mono">The song list could not be loaded — please reload and retry.</span>
                </div>
              ) : (
                <select
                  id="takedown-song"
                  value={chosenSongId}
                  onChange={(e) => setSongId(parseInt(e.target.value, 10))}
                  className={inputClass}
                  required
                >
                  {songsList.map((s) => (
                    <option key={s.id} value={s.id} className="bg-black">
                      {s.title} ({s.artist_name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Claimant Name */}
            <div>
              <label htmlFor="takedown-name" className={labelClass}>{t.takedown.claimantName}</label>
              <input
                id="takedown-name"
                type="text"
                value={claimantName}
                onChange={(e) => setClaimantName(e.target.value)}
                placeholder="Full Name / Record Label"
                className={inputClass}
                required
              />
            </div>

            {/* Claimant Email */}
            <div>
              <label htmlFor="takedown-email" className={labelClass}>{t.takedown.claimantEmail}</label>
              <input
                id="takedown-email"
                type="email"
                value={claimantEmail}
                onChange={(e) => setClaimantEmail(e.target.value)}
                placeholder="contact@rights-holder.com"
                className={inputClass}
                required
              />
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="takedown-reason" className={labelClass}>{t.takedown.reason}</label>
              <select
                id="takedown-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={inputClass}
              >
                <option value="copyright" className="bg-black">{t.takedown.reasonCopyright}</option>
                <option value="broken_video" className="bg-black">{t.takedown.reasonBroken}</option>
                <option value="wrong_metadata" className="bg-black">{t.takedown.reasonMetadata}</option>
                <option value="other" className="bg-black">{t.takedown.reasonOther}</option>
              </select>
            </div>

            {/* Details */}
            <div>
              <label htmlFor="takedown-details" className={labelClass}>{t.takedown.details}</label>
              <textarea
                id="takedown-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Provide official video link, reason, or specific correction needed..."
                className={inputClass}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || (!targetSong && songsList.length === 0)}
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50"
            >
              {submitting ? t.takedown.submitting : t.takedown.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
