import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupTasks, summarizeTasks } from './task-board.ts';

const timestamp = new Date('2026-10-15T12:00:00Z');

function task(id, overrides = {}) {
  return {
    id,
    title: id,
    status: 'BACKLOG',
    priority: 'NEXT',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function cost(overrides = {}) {
  return {
    id: 'cost-1',
    taskId: 'task-1',
    name: 'Paint',
    costType: 'MATERIAL',
    estimatedCost: 10,
    isPurchased: false,
    createdAt: timestamp,
    ...overrides,
  };
}

test('every task appears in exactly one section, with completed tasks excluded from active sections', () => {
  const tasks = [
    task('next'),
    task('soon', { priority: 'SOON' }),
    task('later', { priority: 'LATER' }),
    task('maybe', { priority: 'MAYBE' }),
    task('underway', { status: 'IN_PROGRESS', priority: 'MAYBE' }),
    ...['NEXT', 'SOON', 'LATER', 'MAYBE'].map((priority) =>
      task(`done-${priority}`, { status: 'DONE', priority }),
    ),
  ];
  const sections = groupTasks(tasks);
  assert.deepEqual(sections.inProgress.map((t) => t.id), ['underway']);
  assert.deepEqual(sections.upNext.map((t) => t.id), ['next', 'soon']);
  assert.deepEqual(sections.someday.map((t) => t.id), ['later', 'maybe']);
  assert.equal(sections.completed.length, 4);
  const ids = Object.values(sections).flat().map((t) => t.id);
  assert.equal(ids.length, tasks.length);
  assert.equal(new Set(ids).size, tasks.length);
});

test('completed tasks are newest first without changing the source order', () => {
  const tasks = [
    task('older', { status: 'DONE', completedAt: new Date('2026-10-01') }),
    task('undated', { status: 'DONE' }),
    task('newer', { status: 'DONE', completedAt: timestamp }),
  ];
  assert.deepEqual(groupTasks(tasks).completed.map((t) => t.id), ['newer', 'older', 'undated']);
  assert.deepEqual(tasks.map((t) => t.id), ['older', 'undated', 'newer']);
});

test('empty sections and tasks without costs or time have zero totals', () => {
  assert.deepEqual(groupTasks([]), { inProgress: [], upNext: [], someday: [], completed: [] });
  const zero = { budget: 0, spent: 0, estimatedMinutes: 0, actualMinutes: 0 };
  assert.deepEqual(summarizeTasks([]), zero);
  assert.deepEqual(summarizeTasks([task('no-estimates')]), zero);
});

test('section budgets and time include only that active section', () => {
  const tasks = [
    task('next', { estimatedMinutes: 90, costItems: [cost({ estimatedCost: 12.5 })] }),
    task('soon', { priority: 'SOON', estimatedMinutes: 30, costItems: [cost({ estimatedCost: 7.5 })] }),
    task('underway', { status: 'IN_PROGRESS', estimatedMinutes: 60, costItems: [cost({ estimatedCost: 80 })] }),
    task('later', { priority: 'LATER', estimatedMinutes: 15, costItems: [cost({ estimatedCost: 5 })] }),
    task('done', { status: 'DONE', estimatedMinutes: 600, costItems: [cost({ estimatedCost: 500 })] }),
  ];
  const sections = groupTasks(tasks);
  assert.deepEqual(summarizeTasks(sections.upNext), {
    budget: 20, spent: 0, estimatedMinutes: 120, actualMinutes: 0,
  });
  assert.equal(summarizeTasks(sections.inProgress).budget, 80);
  assert.equal(summarizeTasks(sections.someday).estimatedMinutes, 15);
});

test('completed investment counts purchased costs and logged time only, preserving actual zero costs', () => {
  const tasks = [
    task('active', {
      actualMinutes: 900,
      costItems: [cost({ estimatedCost: 500, isPurchased: true })],
    }),
    task('done', {
      status: 'DONE',
      estimatedMinutes: 500,
      actualMinutes: 75,
      costItems: [
        cost({ estimatedCost: 20, actualCost: 12.75, isPurchased: true }),
        cost({ estimatedCost: 5.25, isPurchased: true }),
        cost({ estimatedCost: 40, actualCost: 0, isPurchased: true }),
        cost({ estimatedCost: 100, actualCost: 80 }),
      ],
    }),
    task('done-unlogged', { status: 'DONE', estimatedMinutes: 1000 }),
  ];
  const totals = summarizeTasks(groupTasks(tasks).completed);
  assert.equal(totals.spent, 18);
  assert.equal(totals.actualMinutes, 75);
});

test('money totals are rounded to cents after summing', () => {
  const totals = summarizeTasks([
    task('fractional', {
      costItems: [
        cost({ estimatedCost: 0.1, isPurchased: true }),
        cost({ estimatedCost: 0.2, isPurchased: true }),
      ],
    }),
  ]);
  assert.equal(totals.budget, 0.3);
  assert.equal(totals.spent, 0.3);
});
