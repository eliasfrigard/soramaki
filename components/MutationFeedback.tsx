'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface Notice {
  message: string;
  focusTargetId?: string;
}

const FeedbackContext = createContext<((notice: Notice) => void) | null>(null);
const MutationScopeContext = createContext<{
  pending: boolean;
  setPending: (pending: boolean) => void;
} | null>(null);

export function MutationFeedback({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) return;
    const focusTarget = () => {
      if (!notice.focusTargetId) return;
      const target = document.getElementById(notice.focusTargetId);
      if (target && !target.matches(':disabled') && target.getClientRects().length > 0 && document.activeElement !== target) {
        target.focus();
      }
    };
    let frame = requestAnimationFrame(focusTarget);
    // Revalidation may replace the row after the action promise resolves.
    const observer = notice.focusTargetId ? new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(focusTarget);
    }) : null;
    observer?.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'hidden'] });
    const stopRestoringFocus = () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
    document.addEventListener('pointerdown', stopRestoringFocus, { capture: true, once: true });
    document.addEventListener('keydown', stopRestoringFocus, { capture: true, once: true });
    const timeout = setTimeout(() => setNotice(null), 5000);
    return () => {
      stopRestoringFocus();
      document.removeEventListener('pointerdown', stopRestoringFocus, true);
      document.removeEventListener('keydown', stopRestoringFocus, true);
      clearTimeout(timeout);
    };
  }, [notice]);

  return (
    <FeedbackContext value={setNotice}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true">
        {notice && (
          <p className="pointer-events-none fixed right-5 bottom-5 left-5 z-50 mx-auto max-w-sm rounded-xl border border-hairline bg-ink-raised px-4 py-3 text-sm text-linen shadow-lg">
            {notice.message}
          </p>
        )}
      </div>
    </FeedbackContext>
  );
}

export function MutationScope({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(false);

  return (
    <MutationScopeContext value={{ pending, setPending }}>
      <fieldset
        disabled={pending}
        aria-busy={pending}
        className="min-w-0"
        onClickCapture={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        {children}
      </fieldset>
    </MutationScopeContext>
  );
}

export function useMutationFeedback() {
  return useContext(FeedbackContext);
}

export function useMutationScope() {
  return useContext(MutationScopeContext);
}
