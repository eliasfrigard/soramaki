import './test-setup.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_MINUTES } from './time.ts';

const { parseForm, readCost, readHours, readOptionalUuid, readStoreUrl, readText } = await import('./form-input.ts');

test('hours distinguish blank, zero, valid Finnish decimals, and invalid input', () => {
  for (const value of [null, '', '  ']) {
    assert.deepEqual(parseForm(() => readHours(value)), { data: null, error: null });
  }
  for (const [value, expected] of [['0', 0], ['1,5', 90], ['1.5', 90], ['.5', 30], ['0.01', 1], ['8760', MAX_MINUTES]]) {
    assert.deepEqual(parseForm(() => readHours(value)), { data: expected, error: null });
  }
  for (const value of ['-1', 'NaN', 'Infinity', '1e3', '0x10', '1.234', '8760.01', new File(['1'], 'hours')]) {
    const result = parseForm(() => readHours(value));
    assert.equal(result.data, null);
    assert.equal(typeof result.error, 'string', String(value));
  }
});

test('optional identifiers clear only for blank values, never malformed values', () => {
  const id = '11111111-1111-4111-8111-111111111111';
  assert.deepEqual(parseForm(() => readOptionalUuid('', 'place')), { data: null, error: null });
  assert.equal(readOptionalUuid(` ${id} `, 'place'), id);
  assert.ok(parseForm(() => readOptionalUuid('broken', 'place')).error);
  assert.ok(parseForm(() => readOptionalUuid(new File([], 'id'), 'place')).error);
});

test('text validation trims input and rejects empty, oversized, and non-text values', () => {
  assert.equal(readText(' Paint ', 'Title', 255), 'Paint');
  assert.equal(readText('a'.repeat(255), 'Title', 255).length, 255);
  for (const value of [null, '  ', 'a'.repeat(256), new File([], 'title')]) {
    assert.ok(parseForm(() => readText(value, 'Title', 255)).error);
  }
});

test('cost input accepts local formatting without allowing malformed or oversized amounts', () => {
  for (const [value, expected] of [[null, 0], ['', 0], ['0', 0], ['1 234,50', 1234.5], ['.50', 0.5], ['99999999.99', 99999999.99]]) {
    assert.equal(readCost(value), expected);
  }
  for (const value of ['-1', '1e3', '0x10', '1.234', '100000000', 'Infinity']) {
    assert.ok(parseForm(() => readCost(value)).error, value);
  }
});

test('store URLs accept only HTTP(S) and distinguish blank from invalid', () => {
  assert.equal(readStoreUrl(''), null);
  assert.equal(readStoreUrl(' https://example.test/paint '), 'https://example.test/paint');
  for (const value of ['not a URL', 'ftp://example.test', 'javascript:alert(1)', 'data:text/plain,test']) {
    assert.ok(parseForm(() => readStoreUrl(value)).error, value);
  }
});

test('form decoding never converts unexpected exceptions into validation results', () => {
  assert.throws(() => parseForm(() => { throw new TypeError('Programming error'); }), /Programming error/);
});
