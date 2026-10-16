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
