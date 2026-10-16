import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toCostItem, toTask } from './types.ts';

const row = {
  id: 'task-1', title: 'Paint', description: null, status: 'BACKLOG', priority: 'NEXT',
  location_id: null, category_id: null, location: null, category: null,
  estimated_minutes: 0, actual_minutes: 0, completed_at: null,
  created_at: '2026-10-16T08:00:00Z', updated_at: '2026-10-16T08:00:00Z',
  costItems: [],
};
const cost = {
  id: 'cost-1', task_id: row.id, name: 'Paint tin', cost_type: 'MATERIAL',
  store_url: null, estimated_cost: 10, actual_cost: 0, is_purchased: true,
  created_at: '2026-10-16T08:00:00Z',
};

test('mapping a fully loaded task preserves empty costs and explicit zero values', () => {
  const task = toTask(row);
  assert.deepEqual(task.costItems, []);
  assert.equal(task.estimatedMinutes, 0);
  assert.equal(task.actualMinutes, 0);
  assert.equal(task.location, undefined);
  assert.ok(task.createdAt instanceof Date);
});

test('mapping normalizes and sorts loaded cost rows without mutating the source', () => {
  const later = { ...cost, id: 'cost-2', created_at: '2026-10-16T09:00:00Z' };
  const task = toTask({ ...row, costItems: [later, cost] });
  assert.deepEqual(task.costItems.map(({ id }) => id), ['cost-1', 'cost-2']);
  assert.equal(task.costItems[0].actualCost, 0);
});

test('missing costs and invalid database cost types cannot silently become valid totals', () => {
  const bareRow = { ...row };
  delete bareRow.costItems;
  assert.throws(() => toTask(bareRow));
  assert.throws(() => toCostItem({ ...cost, cost_type: 'broken' }), /Invalid cost type/);
});
