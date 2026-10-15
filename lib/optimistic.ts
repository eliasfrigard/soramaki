import type { Category, CostItem, Location, Task } from './types';

export interface WorkspaceData {
  tasks: Task[];
  locations: Location[];
  categories: Category[];
}

export type WorkspaceChange =
  | { kind: 'add-task'; task: Task }
  | { kind: 'update-task'; id: string; patch: Partial<Task> }
  | { kind: 'delete-task'; id: string }
  | { kind: 'add-cost'; taskId: string; item: CostItem }
  | { kind: 'update-cost'; taskId: string; id: string; patch: Partial<CostItem> }
  | { kind: 'delete-cost'; taskId: string; id: string }
  | { kind: 'add-location'; tag: Location }
  | { kind: 'add-category'; tag: Category }
  | { kind: 'delete-location'; id: string }
  | { kind: 'delete-category'; id: string };

interface PendingChange {
  id: string;
  change: WorkspaceChange;
}

export interface WorkspaceState {
  source: WorkspaceData;
  confirmed: WorkspaceData;
  pending: PendingChange[];
}

export type WorkspaceEvent =
  | { kind: 'sync'; data: WorkspaceData }
  | { kind: 'begin'; id: string; change: WorkspaceChange }
  | { kind: 'commit'; id: string; change: WorkspaceChange }
  | { kind: 'rollback'; id: string };

function upsert<Entity extends { id: string }>(items: Entity[], item: Entity): Entity[] {
  return items.some((entry) => entry.id === item.id)
    ? items.map((entry) => entry.id === item.id ? item : entry)
    : [...items, item];
}

export function applyWorkspaceChange(data: WorkspaceData, change: WorkspaceChange): WorkspaceData {
  switch (change.kind) {
    case 'add-task':
      return { ...data, tasks: upsert(data.tasks, change.task) };
    case 'update-task':
      return { ...data, tasks: data.tasks.map((task) => task.id === change.id ? { ...task, ...change.patch } : task) };
    case 'delete-task':
      return { ...data, tasks: data.tasks.filter((task) => task.id !== change.id) };
    case 'add-cost':
    case 'update-cost':
    case 'delete-cost':
      return {
        ...data,
        tasks: data.tasks.map((task) => {
          if (task.id !== change.taskId) return task;
          const items = task.costItems ?? [];
          const costItems = change.kind === 'add-cost'
            ? upsert(items, change.item)
            : change.kind === 'delete-cost'
              ? items.filter((item) => item.id !== change.id)
              : items.map((item) => item.id === change.id ? { ...item, ...change.patch } : item);
          return { ...task, costItems };
        }),
      };
    case 'add-location':
      return { ...data, locations: upsert(data.locations, change.tag) };
    case 'add-category':
      return { ...data, categories: upsert(data.categories, change.tag) };
    case 'delete-location':
      return {
        ...data,
        locations: data.locations.filter((tag) => tag.id !== change.id),
        tasks: data.tasks.map((task) => task.locationId === change.id ? { ...task, locationId: undefined, location: undefined } : task),
      };
    case 'delete-category':
      return {
        ...data,
        categories: data.categories.filter((tag) => tag.id !== change.id),
        tasks: data.tasks.map((task) => task.categoryId === change.id ? { ...task, categoryId: undefined, category: undefined } : task),
      };
  }
}

export function workspaceReducer(state: WorkspaceState, event: WorkspaceEvent): WorkspaceState {
  switch (event.kind) {
    case 'sync':
      return { ...state, source: event.data, confirmed: event.data };
    case 'begin':
      return { ...state, pending: [...state.pending, { id: event.id, change: event.change }] };
    case 'commit':
      return {
        ...state,
        confirmed: applyWorkspaceChange(state.confirmed, event.change),
        pending: state.pending.filter((entry) => entry.id !== event.id),
      };
    case 'rollback':
      return { ...state, pending: state.pending.filter((entry) => entry.id !== event.id) };
  }
}

export function optimisticWorkspace(state: WorkspaceState): WorkspaceData {
  return state.pending.reduce((data, entry) => applyWorkspaceChange(data, entry.change), state.confirmed);
}