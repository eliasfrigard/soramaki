'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { CONTEXT_TEXT_MAX_LENGTH, isUuid } from '@/lib/types';
import { databaseFailure, type ActionState } from '@/lib/action-state';
import { parseForm, readText } from '@/lib/form-input';

export async function addComment(taskId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isUuid(taskId)) return { status: 'error', error: 'Invalid task.' };
  const input = parseForm(() => readText(formData.get('content'), 'Comment', CONTEXT_TEXT_MAX_LENGTH));
  if (input.error !== null) return { status: 'error', error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from('comments').insert({
    task_id: taskId,
    content: input.data,
  });

  if (error) return databaseFailure(error, 'Could not add the comment. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}
