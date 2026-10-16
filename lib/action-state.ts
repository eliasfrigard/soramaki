import type { PostgrestError } from '@supabase/supabase-js';

export type ActionState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; error: string };

export type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function databaseFailure(error: PostgrestError, message: string): ActionState {
  console.error(message, error);
  return {
    status: 'error',
    error: error.code === 'PGRST116'
      ? 'This item no longer exists. Refresh the page and try again.'
      : message,
  };
}
