import assert from 'node:assert/strict';
import { test } from 'node:test';
import { optimisticWorkspace, workspaceReducer } from './optimistic.ts';

const timestamp = new Date('2026-10-15T12:00:00Z');
const task = { id: 'task-1', title: 'Paint', priority: 'NEXT', status: 'BACKLOG', createdAt: timestamp, updatedAt: timestamp };
const item = { id: 'cost-1', taskId: task.id, name: 'Paint tin', costType: 'MATERIAL', estimatedCost: 25, isPurchased: false, createdAt: timestamp };

function initial(tasks = [task]) {
  const source = { tasks, locations: [], categories: [] };
  return { source, confirmed: source, pending: [] };
}

test('a task move is immediate and rolls back on failure', () => {
  let state = initial();
  state = workspaceReducer(state, { kind: 'begin', id: 'move', change: { kind: 'update-task', id: task.id, patch: { priority: 'LATER' } } });
  assert.equal(optimisticWorkspace(state).tasks[0].priority, 'LATER');
  state = workspaceReducer(state, { kind: 'rollback', id: 'move' });
  assert.equal(optimisticWorkspace(state).tasks[0].priority, 'NEXT');
});

test('rolling back one mutation preserves another pending mutation', () => {
  let state = initial();
  state = workspaceReducer(state, { kind: 'begin', id: 'move', change: { kind: 'update-task', id: task.id, patch: { priority: 'LATER' } } });
  state = workspaceReducer(state, { kind: 'begin', id: 'cost', change: { kind: 'add-cost', taskId: task.id, item } });
  state = workspaceReducer(state, { kind: 'rollback', id: 'move' });
  assert.equal(optimisticWorkspace(state).tasks[0].priority, 'NEXT');
  assert.deepEqual(optimisticWorkspace(state).tasks[0].costItems, [item]);
});

test('a server refresh keeps pending changes and does not duplicate new items', () => {
  let state = initial();
  state = workspaceReducer(state, { kind: 'begin', id: 'cost', change: { kind: 'add-cost', taskId: task.id, item } });
  state = workspaceReducer(state, { kind: 'sync', data: { ...state.source, tasks: [{ ...task, costItems: [item] }] } });
  assert.equal(optimisticWorkspace(state).tasks[0].costItems.length, 1);
  state = workspaceReducer(state, { kind: 'commit', id: 'cost', change: { kind: 'add-cost', taskId: task.id, item } });
  assert.equal(optimisticWorkspace(state).tasks[0].costItems.length, 1);
});

test('rapid moves retain the latest pending change after an earlier save', () => {
  let state = initial();
  const first = { kind: 'update-task', id: task.id, patch: { priority: 'SOON' } };
  const second = { kind: 'update-task', id: task.id, patch: { priority: 'LATER' } };
  state = workspaceReducer(state, { kind: 'begin', id: 'first', change: first });
  state = workspaceReducer(state, { kind: 'begin', id: 'second', change: second });
  state = workspaceReducer(state, { kind: 'commit', id: 'first', change: first });
  assert.equal(optimisticWorkspace(state).tasks[0].priority, 'LATER');
  state = workspaceReducer(state, { kind: 'rollback', id: 'second' });
  assert.equal(optimisticWorkspace(state).tasks[0].priority, 'SOON');
});

test('cost toggles and deletes roll back without losing other changes', () => {
  let state = initial([{ ...task, costItems: [item] }]);
  state = workspaceReducer(state, { kind: 'begin', id: 'toggle', change: { kind: 'update-cost', taskId: task.id, id: item.id, patch: { isPurchased: true } } });
  assert.equal(optimisticWorkspace(state).tasks[0].costItems[0].isPurchased, true);
  state = workspaceReducer(state, { kind: 'begin', id: 'delete', change: { kind: 'delete-cost', taskId: task.id, id: item.id } });
  assert.equal(optimisticWorkspace(state).tasks[0].costItems.length, 0);
  state = workspaceReducer(state, { kind: 'rollback', id: 'delete' });
  assert.equal(optimisticWorkspace(state).tasks[0].costItems[0].isPurchased, true);
  state = workspaceReducer(state, { kind: 'rollback', id: 'toggle' });
  assert.equal(optimisticWorkspace(state).tasks[0].costItems[0].isPurchased, false);
});

test('failed task deletion restores its cost items', () => {
  let state = initial([{ ...task, costItems: [item] }]);
  state = workspaceReducer(state, { kind: 'begin', id: 'delete', change: { kind: 'delete-task', id: task.id } });
  assert.equal(optimisticWorkspace(state).tasks.length, 0);
  state = workspaceReducer(state, { kind: 'rollback', id: 'delete' });
  assert.deepEqual(optimisticWorkspace(state).tasks[0].costItems, [item]);
});

test('tag removal clears task references and restores them on rollback', () => {
  const location = { id: 'location-1', name: 'Verstas', sortOrder: 10 };
  let state = initial([{ ...task, locationId: location.id, location }]);
  state.source.locations = [location];
  state = workspaceReducer(state, { kind: 'begin', id: 'delete', change: { kind: 'delete-location', id: location.id } });
  assert.equal(optimisticWorkspace(state).locations.length, 0);
  assert.equal(optimisticWorkspace(state).tasks[0].locationId, undefined);
  state = workspaceReducer(state, { kind: 'rollback', id: 'delete' });
  assert.equal(optimisticWorkspace(state).tasks[0].locationId, location.id);
});