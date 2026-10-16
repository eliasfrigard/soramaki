'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/types';
import { databaseFailure, type ActionState } from '@/lib/action-state';
import { parseForm, readText } from '@/lib/form-input';

type TagTable = 'locations' | 'categories';

async function createTag(table: TagTable, formData: FormData): Promise<ActionState> {
  const input = parseForm(() => readText(formData.get('name'), 'Name', 60));
  if (input.error !== null) return { status: 'error', error: input.error };
  const supabase = await createClient();
  const { error } = await supabase.from(table).insert({ name: input.data });

  if (error?.code === '23505') return { status: 'error', error: `"${input.data}" already exists.` };
  if (error) return databaseFailure(error, 'Could not save the tag. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}

async function deleteTag(table: TagTable, id: string): Promise<ActionState> {
  if (!isUuid(id)) return { status: 'error', error: 'Invalid tag.' };
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) return databaseFailure(error, 'Could not delete the tag. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}

export async function createLocation(_state: ActionState, formData: FormData): Promise<ActionState> {
  return createTag('locations', formData);
}

export async function createCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  return createTag('categories', formData);
}

export async function deleteLocation(id: string): Promise<ActionState> {
  return deleteTag('locations', id);
}

export async function deleteCategory(id: string): Promise<ActionState> {
  return deleteTag('categories', id);
}
