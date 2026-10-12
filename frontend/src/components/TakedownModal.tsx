import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
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
  const [songId, setSongId] = useState<number>(targetSong?.id || (songsList[0]?.id || 1));
  const [claimantName, setClaimantName] = useState('');
  const [claimantEmail, setClaimantEmail] = useState('');
  const [reason, setReason] = useState('copyright');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.submitTakedown({
        song: songId,
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

  const resetAndClose = () => {
    setTicketId(null);
    setClaimantName('');
    setClaimantEmail('');
    setDetails('');
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-red-500 focus:outline-none transition-colors duration-150 placeholder:text-neutral-600';
  const labelClass = 'block text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-black border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
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
            <h3 className="text-base font-semibold text-white">{t.takedown.title}</h3>
            <p className="text-[10px] text-neutral-500 font-mono tracking-wider">
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
              <label className={labelClass}>Target Song (सम्बन्धित गीत)</label>
              {targetSong ? (
                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-neutral-300">
                  {targetSong.title} — {targetSong.artist_name}
                </div>
              ) : (
                <select
                  value={songId}
                  onChange={(e) => setSongId(parseInt(e.target.value))}
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
              <label className={labelClass}>{t.takedown.claimantName}</label>
              <input
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
              <label className={labelClass}>{t.takedown.claimantEmail}</label>
              <input
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
              <label className={labelClass}>{t.takedown.reason}</label>
              <select
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
              <label className={labelClass}>{t.takedown.details}</label>
              <textarea
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
              disabled={submitting}
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
