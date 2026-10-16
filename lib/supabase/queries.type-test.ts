import type { Database } from './database.types';
import type { TaskRow } from './queries';

type Assert<T extends true> = T;

export type BoardRequiresLoadedCosts = Assert<
  TaskRow extends { costItems: Database['public']['Tables']['cost_items']['Row'][] } ? true : false
>;

export type BareRowsCannotReplaceJoinedTasks = Assert<
  Database['public']['Tables']['tasks']['Row'] extends TaskRow ? false : true
>;
