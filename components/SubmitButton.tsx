'use client';

import { useContext } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { FormPendingContext } from '@/components/ActionForm';

interface SubmitButtonProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  ariaPressed?: boolean;
  id?: string;
}

export function SubmitButton({ children, className = '', ariaLabel, disabled = false, ariaPressed, id }: SubmitButtonProps) {
  const pending = useContext(FormPendingContext);

  return (
    <button
      type="submit"
      id={id}
      disabled={pending || disabled}
      aria-label={ariaLabel}
      aria-busy={pending}
      aria-pressed={ariaPressed}
      className={`relative inline-flex shrink-0 cursor-pointer items-center justify-center transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <span className={`inline-flex items-center justify-center gap-2 ${pending ? 'opacity-0' : ''}`}>
        {children}
      </span>
      {pending && <LoaderCircle className="absolute size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
    </button>
  );
}
