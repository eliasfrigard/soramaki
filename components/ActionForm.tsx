'use client';

import {
  createContext,
  startTransition,
  useActionState,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  type ReactNode,
} from 'react';
import type { ActionState, FormAction } from '@/lib/action-state';
import { useMutationFeedback, useMutationScope } from '@/components/MutationFeedback';

export const FormPendingContext = createContext(false);

interface ActionFormProps {
  action: FormAction;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  confirmMessage?: string;
  onSuccess?: () => void;
  successMessage?: string;
  focusTargetId?: string;
}

export function ActionForm({
  action, children, className, ariaLabel, confirmMessage, onSuccess,
  successMessage = 'Saved.', focusTargetId,
}: ActionFormProps) {
  const scope = useMutationScope();
  const notify = useMutationFeedback();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (previous, formData) => {
    try {
      const result = await action(previous, formData);
      if (result.status === 'success') notify?.({ message: successMessage, focusTargetId });
      return result;
    } finally {
      scope?.setPending(false);
    }
  }, { status: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const errorId = useId();
  const handleSuccess = useEffectEvent(() => {
    formRef.current?.reset();
    onSuccess?.();
  });

  useEffect(() => {
    if (state.status === 'success') handleSuccess();
    if (state.status === 'error') {
      formRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea, button[type="submit"]')?.focus();
    }
  }, [state]);

  return (
    <FormPendingContext value={pending}>
      <form
        ref={formRef}
        action={formAction}
        className={className}
        aria-label={ariaLabel}
        aria-busy={pending}
        aria-describedby={state.status === 'error' ? errorId : undefined}
        onInvalidCapture={(event) => {
          if (event.target instanceof HTMLElement) {
            const details = event.target.closest('details');
            if (details) details.open = true;
          }
        }}
        onSubmit={(event) => {
          // Reset only successful submissions; React's automatic reset would erase rejected drafts.
          event.preventDefault();
          if (pending || scope?.pending || (confirmMessage && !confirm(confirmMessage))) return;
          const formData = new FormData(event.currentTarget);
          scope?.setPending(true);
          startTransition(() => formAction(formData));
        }}
      >
        <fieldset disabled={pending} className="contents">
          {children}
        </fieldset>
        {state.status === 'error' && (
          <p id={errorId} role="alert" className="col-span-full w-full min-w-0 py-2 text-sm text-berry-soft">
            {state.error}
          </p>
        )}
      </form>
    </FormPendingContext>
  );
}
