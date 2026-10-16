import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

let db;
before(async () => {
  db = new PGlite();
  await db.exec('create role anon; create role authenticated;');
  const directory = new URL('../supabase/migrations/', import.meta.url);
  const migrations = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  for (const name of migrations) {
    if (name === '20261016000000_allocate_tag_order.sql') {
      await db.exec(`
        insert into locations(name, sort_order) values ('Legacy place', 175);
        insert into categories(name, sort_order) values ('Legacy type', 85);
      `);
    }
    await db.exec(await readFile(new URL(name, directory), 'utf8'));
  }
});
after(async () => { await db?.close(); });

test('tag-order migration preserves existing and seeded positions and appends above their maximum', async () => {
  const { rows: seeded } = await db.query("select sort_order from locations where name = 'Yläkerta'");
  assert.equal(seeded[0].sort_order, 10);
  const { rows: places } = await db.query("insert into locations(name) values ('New place') returning sort_order");
  const { rows: types } = await db.query("insert into categories(name) values ('New type') returning sort_order");
  assert.equal(places[0].sort_order, 185);
  assert.equal(types[0].sort_order, 95);
});

test('simultaneous tag inserts receive unique increasing positions', async () => {
  const inserted = await Promise.all(Array.from({ length: 20 }, (_, index) =>
    db.query('insert into locations(name) values ($1) returning sort_order', [`Concurrent ${index}`]),
  ));
  const positions = inserted.map(({ rows }) => rows[0].sort_order);
  assert.equal(new Set(positions).size, 20);
  for (let index = 1; index < positions.length; index++) assert.ok(positions[index] > positions[index - 1]);
});

test('both application roles can use the new sequence defaults on both tag tables', async () => {
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    try {
      for (const table of ['locations', 'categories']) {
        const { rows } = await db.query(`insert into ${table}(name) values ($1) returning sort_order`, [`${role} ${table}`]);
        assert.ok(rows[0].sort_order > 85);
      }
    } finally {
      await db.exec('reset role');
    }
  }
});

test('a rejected combined completion update cannot partially change the row', async () => {
  const { rows: [task] } = await db.query("insert into tasks(title, status, actual_minutes) values ('Paint', 'IN_PROGRESS', 30) returning id");
  await assert.rejects(db.query(
    "update tasks set status = 'DONE', completed_at = now(), actual_minutes = -1 where id = $1",
    [task.id],
  ), /check constraint/);
  const { rows: [unchanged] } = await db.query('select status, completed_at, actual_minutes from tasks where id = $1', [task.id]);
  assert.deepEqual(unchanged, { status: 'IN_PROGRESS', completed_at: null, actual_minutes: 30 });
});

test('task descriptions persist, update and clear after applying every migration', async () => {
  const description = 'First line\n\nSecond line';
  const { rows: [task] } = await db.query(
    'insert into tasks(title, description) values ($1, $2) returning id, description',
    ['Described task', description],
  );
  assert.equal(task.description, description);
  await db.query('update tasks set description = $1 where id = $2', ['Updated', task.id]);
  const { rows: [updated] } = await db.query('select description from tasks where id = $1', [task.id]);
  assert.equal(updated.description, 'Updated');
  await db.query('update tasks set description = null where id = $1', [task.id]);
  const { rows: [cleared] } = await db.query('select description from tasks where id = $1', [task.id]);
  assert.equal(cleared.description, null);
});

test('both application roles can insert and read comments but cannot edit or delete them', async () => {
  const { rows: [task] } = await db.query("insert into tasks(title) values ('Commented task') returning id");
  for (const role of ['anon', 'authenticated']) {
    await db.exec(`set role ${role}`);
    try {
      const { rows: [comment] } = await db.query(
        'insert into comments(task_id, content) values ($1, $2) returning *',
        [task.id, `${role}\ncomment`],
      );
      assert.equal(comment.task_id, task.id);
      assert.equal(comment.user_id, null);
      assert.ok(comment.id);
      assert.ok(Number.isFinite(new Date(comment.created_at).getTime()));
      const { rows } = await db.query('select content from comments where id = $1', [comment.id]);
      assert.equal(rows[0].content, `${role}\ncomment`);
      await assert.rejects(db.query("update comments set content = 'Changed' where id = $1", [comment.id]), /permission denied/);
      await assert.rejects(db.query('delete from comments where id = $1', [comment.id]), /permission denied/);
    } finally {
      await db.exec('reset role');
    }
  }
});

test('comments enforce a valid parent and task deletion cascades to its comments', async () => {
  await assert.rejects(db.query(
    'insert into comments(task_id, content) values ($1, $2)',
    ['11111111-1111-4111-8111-111111111111', 'Missing task'],
  ), /foreign key constraint/);
  const { rows: [task] } = await db.query("insert into tasks(title) values ('Disposable task') returning id");
  await db.exec('set role anon');
  try {
    await db.query("insert into comments(task_id, content) values ($1, 'Goodbye')", [task.id]);
    await db.query('delete from tasks where id = $1', [task.id]);
    const { rows } = await db.query('select id from comments where task_id = $1', [task.id]);
    assert.deepEqual(rows, []);
  } finally {
    await db.exec('reset role');
  }
});
