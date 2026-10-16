import './test-setup.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { tasksQuery } from './supabase/queries.ts';
import { toTask } from './types.ts';

test('the board loads descriptions and comments with tasks in one joined query', async () => {
  const requests = [];
  const row = {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Paint', description: 'Two coats\nWhite paint',
    status: 'BACKLOG', priority: 'NEXT',
    location_id: null, category_id: null, location: null, category: null,
    estimated_minutes: null, actual_minutes: null, completed_at: null,
    created_at: '2026-10-16T08:00:00Z', updated_at: '2026-10-16T08:00:00Z',
    costItems: [],
    comments: [{
      id: '22222222-2222-4222-8222-222222222222',
      task_id: '11111111-1111-4111-8111-111111111111',
      user_id: null, content: 'Remember the primer', created_at: '2026-10-16T09:00:00Z',
    }],
  };
  const client = createClient('http://test.invalid', 'test-only', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        requests.push(new URL(new Request(input, init).url));
        return Response.json([row]);
      },
    },
  });
  const { data } = await tasksQuery(client).throwOnError();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].pathname, '/rest/v1/tasks');
  assert.equal(requests[0].searchParams.get('select'), '*,location:locations(*),category:categories(*),costItems:cost_items(*),comments(*)');
  assert.equal(requests[0].searchParams.get('order'), 'priority.asc,created_at.desc');
  const task = toTask(data[0]);
  assert.equal(task.description, row.description);
  assert.equal(task.comments[0].content, 'Remember the primer');
});

test('a failed joined query is surfaced instead of rendering an empty discussion', async () => {
  const client = createClient('http://test.invalid', 'test-only', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async () => Response.json({
        code: '42501', message: 'Comments cannot be read', details: '', hint: '',
      }, { status: 403 }),
    },
  });
  await assert.rejects(async () => tasksQuery(client).throwOnError(), /Comments cannot be read/);
});
