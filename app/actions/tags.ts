'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/types';

type TagTable = 'locations' | 'categories';

export interface TagFormState {
  error?: string;
}

const MAX_NAME_LENGTH = 60;
const UNIQUE_VIOLATION = '23505';

async function createTag(table: TagTable, formData: FormData): Promise<TagFormState> {
  const name = String(formData.get('name') ?? '').trim();
  if (!name || name.length > MAX_NAME_LENGTH) {
    return { error: `Name must be 1–${MAX_NAME_LENGTH} characters.` };
  }

  const supabase = await createClient();
  const { data: last } = await supabase
    .from(table)
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from(table)
    .insert({ name, sort_order: (last?.sort_order ?? 0) + 10 });

  if (error) {
    return { error: error.code === UNIQUE_VIOLATION ? `"${name}" already exists.` : 'Could not save. Try again.' };
  }
  revalidatePath('/');
  return {};
}

async function deleteTag(table: TagTable, id: string): Promise<void> {
  if (!isUuid(id)) throw new Error('Invalid id.');

  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) throw new Error(`Failed to delete: ${error.message}`);
  revalidatePath('/');
}

export async function createLocation(_prev: TagFormState, formData: FormData): Promise<TagFormState> {
  return createTag('locations', formData);
}

export async function createCategory(_prev: TagFormState, formData: FormData): Promise<TagFormState> {
  return createTag('categories', formData);
}

export async function deleteLocation(id: string): Promise<void> {
  return deleteTag('locations', id);
}

export async function deleteCategory(id: string): Promise<void> {
  return deleteTag('categories', id);
}
