'use client';

import { useContext } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { FormPendingContext } from '@/components/ActionForm';

interface SubmitButtonProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function SubmitButton({ children, className = '', ariaLabel }: SubmitButtonProps) {
  const pending = useContext(FormPendingContext);

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={ariaLabel}
      aria-busy={pending}
      className={`inline-flex items-center justify-center gap-2 transition active:scale-[0.97] disabled:opacity-60 ${className}`}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : children}
    </button>
  );
}
