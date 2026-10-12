export const PRIORITIES = ['NEXT', 'SOON', 'LATER', 'MAYBE'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ['BACKLOG', 'IN_PROGRESS', 'DONE'] as const;
export type Status = (typeof STATUSES)[number];

export const COST_TYPES = ['MATERIAL', 'TOOL', 'CONTRACTOR', 'OTHER'] as const;
export type CostType = (typeof COST_TYPES)[number];

export interface CostItem {
  id: string;
  taskId: string;
  name: string;
  costType: CostType;
  storeUrl?: string;
  estimatedCost: number;
  actualCost?: number;
  isPurchased: boolean;
  createdAt: Date;
}

export interface Location {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  locationId?: string;
  categoryId?: string;
  location?: Location;
  category?: Category;
  costItems?: CostItem[];
  estimatedMinutes?: number;
  actualMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/** Raw row shapes as returned by Supabase (snake_case, ISO strings). */
export interface LocationRow {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export type CategoryRow = LocationRow;

export interface CostItemRow {
  id: string;
  task_id: string;
  name: string;
  cost_type: CostType;
  store_url: string | null;
  estimated_cost: number | string;
  actual_cost: number | string | null;
  is_purchased: boolean;
  created_at: string;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  location_id: string | null;
  category_id: string | null;
  location?: LocationRow | null;
  category?: CategoryRow | null;
  costItems?: CostItemRow[];
  estimated_minutes: number | null;
  actual_minutes: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function toLocation(row: LocationRow): Location {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? undefined,
    sortOrder: row.sort_order,
  };
}

export const toCategory: (row: CategoryRow) => Category = toLocation;

export function toCostItem(row: CostItemRow): CostItem {
  return {
    id: row.id,
    taskId: row.task_id,
    name: row.name,
    costType: row.cost_type,
    storeUrl: row.store_url ?? undefined,
    estimatedCost: Number(row.estimated_cost),
    actualCost: row.actual_cost == null ? undefined : Number(row.actual_cost),
    isPurchased: row.is_purchased,
    createdAt: new Date(row.created_at),
  };
}

export function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    locationId: row.location_id ?? undefined,
    categoryId: row.category_id ?? undefined,
    location: row.location ? toLocation(row.location) : undefined,
    category: row.category ? toCategory(row.category) : undefined,
    costItems: row.costItems
      ?.map(toCostItem)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    estimatedMinutes: row.estimated_minutes ?? undefined,
    actualMinutes: row.actual_minutes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
  };
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === 'string' && (PRIORITIES as readonly string[]).includes(value);
}

export function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value);
}

export function isCostType(value: unknown): value is CostType {
  return typeof value === 'string' && (COST_TYPES as readonly string[]).includes(value);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}
