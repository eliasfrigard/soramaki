import type { QueryData, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export function tasksQuery(client: SupabaseClient<Database>) {
  return client
    .from('tasks')
    .select('*, location:locations(*), category:categories(*), costItems:cost_items(*)')
    .order('priority')
    .order('created_at', { ascending: false });
}

export type TaskRow = QueryData<ReturnType<typeof tasksQuery>>[number];
