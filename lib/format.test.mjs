import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatCategoryName, formatDate, formatDateTime, formatEuro } from './format.ts';
import { PRIORITY_META } from './priority.ts';
import { formatWorkdays } from './time.ts';

test('priority labels are Finnish while priority values remain unchanged', () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(PRIORITY_META).map(([value, meta]) => [value, meta.label])),
    { NEXT: 'Seuraavaksi', SOON: 'Pian', LATER: 'Myöhemmin', MAYBE: 'Epätodennäköistä' },
  );
});

test('built-in task types have Finnish display names', () => {
  for (const [name, label] of [
    ['Purchase', 'Hankinta'],
    ['Construction', 'Rakentaminen'],
    ['Maintenance', 'Kunnossapito'],
    ['Cleaning', 'Siivous'],
  ]) {
    assert.equal(formatCategoryName(name), label);
  }
});

test('custom and already Finnish type names are preserved', () => {
  for (const name of ['Maalaus', 'Siivous', 'Custom type', 'toString', '']) {
    assert.equal(formatCategoryName(name), name);
  }
});

test('workday descriptions use Finnish and preserve the one-workday threshold', () => {
  assert.equal(formatWorkdays(479), undefined);
  assert.equal(formatWorkdays(1500), '≈ 3,1 työpäivää');
});

test('existing Finnish currency and Helsinki date formatting is preserved', () => {
  assert.equal(formatEuro(12.5).replace(/\s/g, ' '), '12,50 €');
  assert.equal(formatDate(new Date('2026-10-15T22:30:00Z')), '16.10.2026');
});

test('comment timestamps include the Finnish date and Helsinki local time', () => {
  assert.match(formatDateTime(new Date('2026-10-15T22:30:00Z')), /16\.10\.2026.*1[.:]30/);
  assert.match(formatDateTime(new Date('2026-12-15T22:30:00Z')), /16\.12\.2026.*0[.:]30/);
});
