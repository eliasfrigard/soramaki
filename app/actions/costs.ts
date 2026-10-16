'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isCostType, isUuid } from '@/lib/types';
import { databaseFailure, type ActionState } from '@/lib/action-state';
import { parseForm, readCost, readStoreUrl, readText } from '@/lib/form-input';

export async function addCostItem(taskId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  if (!isUuid(taskId)) return { status: 'error', error: 'Invalid task.' };
  const costType = formData.get('cost_type') ?? 'MATERIAL';
  if (!isCostType(costType)) return { status: 'error', error: 'Choose a valid cost type.' };
  const input = parseForm(() => ({
    name: readText(formData.get('name'), 'Name', 255),
    estimated_cost: readCost(formData.get('estimated_cost')),
    store_url: readStoreUrl(formData.get('store_url')),
  }));
  if (input.error !== null) return { status: 'error', error: input.error };

  const supabase = await createClient();
  const { error } = await supabase.from('cost_items').insert({
    ...input.data,
    task_id: taskId,
    cost_type: costType,
  });

  if (error) return databaseFailure(error, 'Could not add the cost item. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}

export async function toggleCostItemPurchased(id: string, isPurchased: boolean): Promise<ActionState> {
  if (!isUuid(id) || typeof isPurchased !== 'boolean') return { status: 'error', error: 'Invalid cost item.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('cost_items')
    .update({ is_purchased: isPurchased })
    .eq('id', id)
    .select('id')
    .single();

  if (error) return databaseFailure(error, 'Could not update the cost item. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}

export async function deleteCostItem(id: string): Promise<ActionState> {
  if (!isUuid(id)) return { status: 'error', error: 'Invalid cost item.' };
  const supabase = await createClient();
  const { error } = await supabase.from('cost_items').delete().eq('id', id);

  if (error) return databaseFailure(error, 'Could not delete the cost item. Try again.');
  revalidatePath('/');
  return { status: 'success' };
}
