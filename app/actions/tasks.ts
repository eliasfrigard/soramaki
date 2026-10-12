'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isPriority, isStatus, isUuid, type Priority, type Status } from '@/lib/types';
import { isValidMinutes } from '@/lib/time';

const MAX_TITLE_LENGTH = 255;

function optionalUuid(value: FormDataEntryValue | null): string | null {
  return isUuid(value) ? value : null;
}

function optionalMinutes(value: FormDataEntryValue | null): number | null {
  if (value === null || value === '') return null;
  const minutes = Number(value);
  if (!isValidMinutes(minutes)) throw new Error('Estimated time is out of range.');
  return minutes;
}

export async function createTask(formData: FormData): Promise<void> {
  const title = String(formData.get('title') ?? '').trim();
  if (!title || title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be 1–${MAX_TITLE_LENGTH} characters.`);
  }

  const priorityInput = formData.get('priority');
  const priority = isPriority(priorityInput) ? priorityInput : 'NEXT';
  const location_id = optionalUuid(formData.get('location_id'));
  const category_id = optionalUuid(formData.get('category_id'));
  const estimated_minutes = optionalMinutes(formData.get('estimated_minutes'));

  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .insert({ title, priority, status: 'BACKLOG', location_id, category_id, estimated_minutes });

  if (error) throw new Error(`Failed to create task: ${error.message}`);
  revalidatePath('/');
}

export async function updateTaskStatus(id: string, status: Status): Promise<void> {
  if (!isStatus(status)) throw new Error('Invalid status.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({
      status,
      completed_at: status === 'DONE' ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) throw new Error(`Failed to update task: ${error.message}`);
  revalidatePath('/');
}

/** Puts a task (back) into a priority bucket: pauses started tasks and reopens done ones. */
export async function moveTask(id: string, priority: Priority): Promise<void> {
  if (!isUuid(id) || !isPriority(priority)) throw new Error('Invalid input.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ priority, status: 'BACKLOG', completed_at: null })
    .eq('id', id);

  if (error) throw new Error(`Failed to move task: ${error.message}`);
  revalidatePath('/');
}

export async function updateTask(id: string, formData: FormData): Promise<void> {
  if (!isUuid(id)) throw new Error('Invalid task.');

  const title = String(formData.get('title') ?? '').trim();
  if (!title || title.length > MAX_TITLE_LENGTH) {
    throw new Error(`Title must be 1–${MAX_TITLE_LENGTH} characters.`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      location_id: optionalUuid(formData.get('location_id')),
      category_id: optionalUuid(formData.get('category_id')),
      estimated_minutes: optionalMinutes(formData.get('estimated_minutes')),
    })
    .eq('id', id);

  if (error) throw new Error(`Failed to update task: ${error.message}`);
  revalidatePath('/');
}

export async function updateTaskActualTime(taskId: string, actualMinutes: number): Promise<void> {
  if (!isUuid(taskId)) throw new Error('Invalid task.');
  if (!isValidMinutes(actualMinutes)) throw new Error('Actual time is out of range.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({ actual_minutes: actualMinutes })
    .eq('id', taskId);

  if (error) throw new Error(`Failed to log time: ${error.message}`);
  revalidatePath('/');
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);

  if (error) throw new Error(`Failed to delete task: ${error.message}`);
  revalidatePath('/');
}
