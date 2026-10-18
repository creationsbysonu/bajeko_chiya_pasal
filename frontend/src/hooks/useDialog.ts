import { useEffect, useRef } from 'react';

/**
 * Shared modal behaviour so every dialog in the app behaves the way assistive
 * technology and keyboard users expect:
 *
 *   - Escape closes it (the handler is capture-phase so an Escape typed inside
 *     a nested dialog only closes the innermost one).
 *   - Focus moves into the dialog on open and is restored to the trigger on
 *     close, so Tab never leaves the user stranded.
 *   - Tab is trapped inside the dialog.
 *   - The page behind stops scrolling while the dialog is open.
 *
 * Pair it with `role="dialog" aria-modal="true"` and a ref on the dialog
 * container.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useDialog(
  open: boolean,
  onClose: () => void,
  containerRef: React.RefObject<HTMLElement | null>
): void {
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = (document.activeElement as HTMLElement | null) ?? null;

    // Move focus in — prefer the first real control, else the container itself.
    const focusables = () =>
      Array.from(containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);
    const firstFocusable = focusables()[0];
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      containerRef.current?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const nodes = focusables().filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (nodes.length === 0) {
        e.preventDefault();
        containerRef.current?.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === containerRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = previousOverflow;
      // Restore focus to whatever opened us, if it is still in the document.
      const target = previouslyFocused.current;
      if (target && document.contains(target)) {
        target.focus();
      }
    };
  }, [open, containerRef]);
}
