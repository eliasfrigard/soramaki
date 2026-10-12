import { isUuid } from '@/lib/types';

export type StatusFilter = 'active' | 'completed';

export interface TaskFilters {
  locationId?: string;
  categoryId?: string;
  status: StatusFilter;
}

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Unknown or malformed params are ignored rather than erroring. */
export function parseTaskFilters(searchParams: SearchParams): TaskFilters {
  const locationId = first(searchParams.locationId);
  const categoryId = first(searchParams.categoryId);

  return {
    locationId: isUuid(locationId) ? locationId : undefined,
    categoryId: isUuid(categoryId) ? categoryId : undefined,
    status: first(searchParams.status) === 'completed' ? 'completed' : 'active',
  };
}

export function toSearchParams(filters: TaskFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.locationId) params.set('locationId', filters.locationId);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.status === 'completed') params.set('status', 'completed');
  return params;
}
