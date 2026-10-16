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
import type { FormAction } from '@/lib/action-state';

export const FormPendingContext = createContext(false);

interface ActionFormProps {
  action: FormAction;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  confirmMessage?: string;
  onSuccess?: () => void;
}

export function ActionForm({ action, children, className, ariaLabel, confirmMessage, onSuccess }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const errorId = useId();
  const handleSuccess = useEffectEvent(() => {
    formRef.current?.reset();
    onSuccess?.();
  });

  useEffect(() => {
    if (state.status === 'success') handleSuccess();
  }, [state]);

  return (
    <FormPendingContext value={pending}>
      <form
        ref={formRef}
        action={formAction}
        className={className}
        aria-label={ariaLabel}
        aria-describedby={state.status === 'error' ? errorId : undefined}
        onSubmit={(event) => {
          // Reset only successful submissions; React's automatic reset would erase rejected drafts.
          event.preventDefault();
          if (pending || (confirmMessage && !confirm(confirmMessage))) return;
          const formData = new FormData(event.currentTarget);
          startTransition(() => formAction(formData));
        }}
      >
        {children}
        {state.status === 'error' && (
          <p id={errorId} role="alert" className="col-span-full w-full py-1 text-xs text-berry-soft">
            {state.error}
          </p>
        )}
      </form>
    </FormPendingContext>
  );
}
