import './test-setup.mjs';
import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';
import { createClient } from '@supabase/supabase-js';

const id = '11111111-1111-4111-8111-111111111111';
const idle = { status: 'idle' };
let fixture;

mock.module('next/cache.js', {
  namedExports: { revalidatePath: (path) => fixture.refreshes.push(path) },
});
mock.module('./supabase/server.ts', {
  namedExports: {
    createClient: async () => {
      if (fixture.unexpected) throw new Error('Unexpected configuration failure');
      return fixture.client;
    },
  },
});

const tasks = await import('../app/actions/tasks.ts');
const costs = await import('../app/actions/costs.ts');
const tags = await import('../app/actions/tags.ts');

function form(values = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function setup() {
  const state = {
    row: { id, status: 'IN_PROGRESS', actual_minutes: 30, estimated_minutes: 90 },
    requests: [],
    refreshes: [],
    failure: null,
    missing: false,
    unexpected: false,
  };
  state.client = createClient('http://test.invalid', 'test-only', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const request = new Request(input, init);
        const url = new URL(request.url);
        const body = request.method === 'PATCH' || request.method === 'POST' ? await request.json() : null;
        state.requests.push({ method: request.method, table: url.pathname.split('/').at(-1), body, url });
        const json = (value, status = 200) => Response.json(value, { status });
        if (state.failure) return json({ code: state.failure, message: 'Simulated database failure', details: '', hint: '' }, 400);
        if (request.method === 'PATCH') {
          if (state.missing) {
            return request.headers.get('accept')?.includes('object')
              ? json({ code: 'PGRST116', message: 'No rows', details: '', hint: '' }, 406)
              : new Response(null, { status: 204 });
          }
          Object.assign(state.row, body);
          return json({ ...state.row });
        }
        if (request.method === 'POST' || request.method === 'DELETE') return new Response(null, { status: 204 });
        throw new Error(`Unexpected database request: ${request.method} ${url.pathname}`);
      },
    },
  });
  return state;
}

beforeEach(() => { fixture = setup(); });

test('completion saves status, timestamp and time with one write and one refresh', async () => {
  const result = await tasks.completeTask(id, idle, form({ actual_hours: '1,5' }));
  assert.equal(result.status, 'success');
  assert.equal(fixture.requests.length, 1);
  assert.equal(fixture.row.status, 'DONE');
  assert.equal(fixture.row.actual_minutes, 90);
  assert.ok(Number.isFinite(Date.parse(fixture.row.completed_at)));
  assert.equal(fixture.requests[0].url.searchParams.get('select'), 'id');
  assert.deepEqual(fixture.refreshes, ['/']);
});

test('failed completion does not partially save time or refresh the page', async (t) => {
  t.mock.method(console, 'error', () => {});
  fixture.failure = '08006';
  const previous = { ...fixture.row };
  const result = await tasks.completeTask(id, idle, form({ actual_hours: '1.5' }));
  assert.equal(result.status, 'error');
  assert.equal(fixture.requests.length, 1);
  assert.deepEqual(fixture.row, previous);
  assert.deepEqual(fixture.refreshes, []);
  assert.equal(console.error.mock.callCount(), 1);
});

test('skipping completion time preserves earlier logged time, but explicit zero replaces it', async () => {
  await tasks.completeTask(id, idle, form());
  assert.equal(fixture.row.actual_minutes, 30);
  assert.ok(!Object.hasOwn(fixture.requests[0].body, 'actual_minutes'));
  await tasks.completeTask(id, idle, form({ actual_hours: '0' }));
  assert.equal(fixture.row.actual_minutes, 0);
});

test('task creation and editing decode raw hours on the server', async () => {
  assert.equal((await tasks.createTask(idle, form({ title: ' Paint ', estimated_hours: '1,5' }))).status, 'success');
  assert.deepEqual(fixture.requests[0].body, {
    title: 'Paint', priority: 'NEXT', status: 'BACKLOG',
    location_id: null, category_id: null, estimated_minutes: 90,
  });
  assert.equal((await tasks.updateTask(id, idle, form({ title: 'Paint', estimated_hours: '' }))).status, 'success');
  assert.equal(fixture.row.estimated_minutes, null);
  assert.equal((await tasks.updateTask(id, idle, form({ title: 'Paint', estimated_hours: '0' }))).status, 'success');
  assert.equal(fixture.row.estimated_minutes, 0);
});

test('invalid input returns a form error without writing, clearing values, or revalidating', async () => {
  const attempts = [
    () => tasks.createTask(idle, form({ title: '   ' })),
    () => tasks.createTask(idle, form({ title: 'Paint', priority: 'broken' })),
    () => tasks.updateTask(id, idle, form({ title: 'Paint', estimated_hours: '-1' })),
    () => tasks.updateTask(id, idle, form({ title: 'Paint', location_id: 'broken' })),
    () => tasks.updateTask(id, idle, form({ title: 'Paint', category_id: 'broken' })),
    () => tasks.completeTask(id, idle, form({ actual_hours: '8760.01' })),
    () => costs.addCostItem(id, idle, form({ name: 'Paint', store_url: 'ftp://example.test' })),
    () => costs.addCostItem(id, idle, form({ name: 'Paint', estimated_cost: '-1' })),
    () => costs.addCostItem(id, idle, form({ name: 'Paint', cost_type: 'broken' })),
    () => tags.createLocation(idle, form({ name: ' ' })),
    () => tags.createCategory(idle, form({ name: 'a'.repeat(61) })),
    () => tasks.startTask('broken'),
    () => tasks.moveTask(id, 'broken'),
    () => tasks.deleteTask('broken'),
    () => costs.toggleCostItemPurchased(id, 'broken'),
    () => costs.deleteCostItem('broken'),
    () => tags.deleteLocation('broken'),
    () => tags.deleteCategory('broken'),
  ];
  for (const attempt of attempts) {
    const result = await attempt();
    assert.equal(result.status, 'error');
    assert.ok(result.error);
  }
  assert.equal(fixture.row.estimated_minutes, 90);
  assert.equal(fixture.requests.length, 0);
  assert.equal(fixture.refreshes.length, 0);
});

test('every update rejects a missing record instead of reporting success', async (t) => {
  t.mock.method(console, 'error', () => {});
  fixture.missing = true;
  for (const attempt of [
    () => tasks.startTask(id),
    () => tasks.moveTask(id, 'LATER'),
    () => tasks.updateTask(id, idle, form({ title: 'Paint' })),
    () => tasks.completeTask(id, idle, form()),
    () => costs.toggleCostItemPurchased(id, true),
  ]) {
    const result = await attempt();
    assert.equal(result.status, 'error');
    assert.match(result.error, /no longer exists/);
  }
  assert.equal(fixture.requests.length, 5);
  assert.equal(fixture.refreshes.length, 0);
});

test('starting and moving tasks preserve their existing lifecycle behaviour', async () => {
  await tasks.startTask(id);
  assert.equal(fixture.row.status, 'IN_PROGRESS');
  assert.equal(fixture.row.completed_at, null);
  await tasks.moveTask(id, 'LATER');
  assert.equal(fixture.row.status, 'BACKLOG');
  assert.equal(fixture.row.priority, 'LATER');
  assert.equal(fixture.row.completed_at, null);
});

test('cost creation validates and normalizes its own form data', async () => {
  const result = await costs.addCostItem(id, idle, form({
    name: ' Paint tin ', estimated_cost: '1 234,50', store_url: 'https://example.test',
  }));
  assert.equal(result.status, 'success');
  assert.deepEqual(fixture.requests[0].body, {
    task_id: id, name: 'Paint tin', estimated_cost: 1234.5,
    store_url: 'https://example.test/', cost_type: 'MATERIAL',
  });
  assert.equal((await costs.toggleCostItemPurchased(id, true)).status, 'success');
  assert.equal(fixture.row.is_purchased, true);
});

test('tag creation performs only an insert and leaves ordering to the database', async () => {
  await tags.createLocation(idle, form({ name: ' Workshop ' }));
  await tags.createCategory(idle, form({ name: 'Painting' }));
  assert.deepEqual(fixture.requests.map(({ method, body }) => ({ method, body })), [
    { method: 'POST', body: { name: 'Workshop' } },
    { method: 'POST', body: { name: 'Painting' } },
  ]);
});

test('duplicate tags return an actionable validation error', async () => {
  fixture.failure = '23505';
  const result = await tags.createLocation(idle, form({ name: 'Workshop' }));
  assert.equal(result.status, 'error');
  assert.match(result.error, /already exists/);
  assert.equal(fixture.refreshes.length, 0);
});

test('deletion is explicitly idempotent for tasks, costs, places and types', async () => {
  fixture.missing = true;
  for (const remove of [tasks.deleteTask, costs.deleteCostItem, tags.deleteLocation, tags.deleteCategory]) {
    assert.equal((await remove(id)).status, 'success');
  }
  assert.equal(fixture.requests.length, 4);
  assert.equal(fixture.refreshes.length, 4);
});

test('all database mutation failures are logged and surfaced without revalidation', async (t) => {
  t.mock.method(console, 'error', () => {});
  fixture.failure = '08006';
  for (const attempt of [
    () => tasks.createTask(idle, form({ title: 'Paint' })),
    () => tasks.deleteTask(id),
    () => costs.addCostItem(id, idle, form({ name: 'Paint' })),
    () => costs.deleteCostItem(id),
    () => tags.createLocation(idle, form({ name: 'Workshop' })),
    () => tags.createCategory(idle, form({ name: 'Painting' })),
    () => tags.deleteLocation(id),
    () => tags.deleteCategory(id),
  ]) {
    const result = await attempt();
    assert.equal(result.status, 'error');
    assert.ok(result.error);
  }
  assert.equal(console.error.mock.callCount(), 8);
  assert.equal(fixture.refreshes.length, 0);
});

test('unexpected infrastructure exceptions reach the route error boundary', async () => {
  fixture.unexpected = true;
  await assert.rejects(tasks.createTask(idle, form({ title: 'Paint' })), /Unexpected configuration failure/);
});
