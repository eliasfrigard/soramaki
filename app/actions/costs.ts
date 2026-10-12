'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isCostType, isUuid } from '@/lib/types';

const MAX_NAME_LENGTH = 255;
const MAX_COST = 99_999_999.99;

/** Accepts Finnish-style input like "1 234,50" as well as "1234.50". */
function parseCost(value: FormDataEntryValue | null): number {
  const normalized = String(value ?? '').replace(/\s/g, '').replace(',', '.');
  if (normalized === '') return 0;

  const cost = Number(normalized);
  if (!Number.isFinite(cost) || cost < 0 || cost > MAX_COST) {
    throw new Error('Estimated cost must be a positive number.');
  }
  return Math.round(cost * 100) / 100;
}

function parseStoreUrl(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? '').trim();
  if (raw === '') return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Store URL is not a valid URL.');
  }
  // Only http(s) so stored links can never become javascript:/data: hrefs.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Store URL must start with http:// or https://.');
  }
  return url.toString();
}

export async function addCostItem(taskId: string, formData: FormData): Promise<void> {
  if (!isUuid(taskId)) throw new Error('Invalid task.');

  const name = String(formData.get('name') ?? '').trim();
  if (!name || name.length > MAX_NAME_LENGTH) {
    throw new Error(`Name must be 1–${MAX_NAME_LENGTH} characters.`);
  }

  const costTypeInput = formData.get('cost_type');
  const cost_type = isCostType(costTypeInput) ? costTypeInput : 'MATERIAL';

  const supabase = await createClient();
  const { error } = await supabase.from('cost_items').insert({
    task_id: taskId,
    name,
    cost_type,
    estimated_cost: parseCost(formData.get('estimated_cost')),
    store_url: parseStoreUrl(formData.get('store_url')),
  });

  if (error) throw new Error(`Failed to add cost item: ${error.message}`);
  revalidatePath('/');
}

export async function toggleCostItemPurchased(id: string, isPurchased: boolean): Promise<void> {
  if (!isUuid(id) || typeof isPurchased !== 'boolean') throw new Error('Invalid input.');

  const supabase = await createClient();
  const { error } = await supabase
    .from('cost_items')
    .update({ is_purchased: isPurchased })
    .eq('id', id);

  if (error) throw new Error(`Failed to update cost item: ${error.message}`);
  revalidatePath('/');
}

export async function deleteCostItem(id: string): Promise<void> {
  if (!isUuid(id)) throw new Error('Invalid cost item.');

  const supabase = await createClient();
  const { error } = await supabase.from('cost_items').delete().eq('id', id);

  if (error) throw new Error(`Failed to delete cost item: ${error.message}`);
  revalidatePath('/');
}
