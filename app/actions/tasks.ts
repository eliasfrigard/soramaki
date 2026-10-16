'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isPriority, isUuid, type Priority } from '@/lib/types';
import { databaseFailure, type ActionState } from '@/lib/action-state';
import { parseForm, readHours, readOptionalUuid, readText } from '@/lib/form-input';

function taskFields(formData: FormData) {
  return parseForm(() => ({
    title: readText(formData.get('title'), 'Title', 255),
    location_id: readOptionalUuid(formData.get('location_id'), 'place'),
    category_id: readOptionalUuid(formData.get('category_id'), 'type'),
    estimated_minutes: readHours(formData.get('estimated_hours')),
  }));
}

export async function createTask(_state: ActionState, formData: FormData): Promise<ActionState> {
  const input = taskFields(formData);
  if (input.error !== null) return { status: 'error', error: input.error };
  const priority = formData.get('priority') ?? 'NEXT';
  if (!isPriority(priority)) return { status: 'error', error: 'Choose a valid priority.' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .insert({ ...input.data, priority, status: 'BACKLOG' });

  if (error) return databaseFailure(error, 'Could not create the task. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}

export async function startTask(id: string): Promise<ActionState> {
  if (!isUuid(id)) return { status: 'error', error: 'Invalid task.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ status: 'IN_PROGRESS', completed_at: null })
    .eq('id', id)
    .select('id')
    .single();

  if (error) return databaseFailure(error, 'Could not start the task. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}

export async function completeTask(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isUuid(id)) return { status: 'error', error: 'Invalid task.' };
  const input = parseForm(() => readHours(formData.get('actual_hours')));
  if (input.error !== null) return { status: 'error', error: input.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'DONE',
      completed_at: new Date().toISOString(),
      ...(input.data === null ? {} : { actual_minutes: input.data }),
    })
    .eq('id', id)
    .select('id')
    .single();

  if (error) return databaseFailure(error, 'Could not complete the task. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}

/** Pauses started tasks and reopens completed ones in the chosen priority bucket. */
export async function moveTask(id: string, priority: Priority): Promise<ActionState> {
  if (!isUuid(id) || !isPriority(priority)) return { status: 'error', error: 'Invalid task or priority.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ priority, status: 'BACKLOG', completed_at: null })
    .eq('id', id)
    .select('id')
    .single();

  if (error) return databaseFailure(error, 'Could not move the task. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}

export async function updateTask(id: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isUuid(id)) return { status: 'error', error: 'Invalid task.' };
  const input = taskFields(formData);
  if (input.error !== null) return { status: 'error', error: input.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update(input.data)
    .eq('id', id)
    .select('id')
    .single();

  if (error) return databaseFailure(error, 'Could not save the task. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}

export async function deleteTask(id: string): Promise<ActionState> {
  if (!isUuid(id)) return { status: 'error', error: 'Invalid task.' };
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) return databaseFailure(error, 'Could not delete the task. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}
