import { isUuid } from './types';
import { HOURS_INPUT_PATTERN, hoursToMinutes, isValidMinutes } from './time';

class ValidationError extends Error {}

export function parseForm<T>(read: () => T): { data: T; error: null } | { data: null; error: string } {
  try {
    return { data: read(), error: null };
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    return { data: null, error: error.message };
  }
}

export function readText(value: FormDataEntryValue | null, label: string, maxLength: number): string {
  const text = typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : '';
  if (!text || text.length > maxLength) {
    throw new ValidationError(`${label} must be 1-${maxLength} characters.`);
  }
  return text;
}

function optionalText(value: FormDataEntryValue | null): string {
  if (value === null) return '';
  if (typeof value !== 'string') throw new ValidationError('Expected a text value.');
  return value.trim();
}

export function readOptionalText(value: FormDataEntryValue | null, label: string, maxLength: number): string | null {
  const raw = optionalText(value);
  return raw === '' ? null : readText(raw, label, maxLength);
}

export function readOptionalUuid(value: FormDataEntryValue | null, label: string): string | null {
  const raw = optionalText(value);
  if (raw === '') return null;
  if (!isUuid(raw)) throw new ValidationError(`Choose a valid ${label}.`);
  return raw;
}

export function readHours(value: FormDataEntryValue | null): number | null {
  const raw = optionalText(value);
  if (raw === '') return null;
  if (!new RegExp(`^(?:${HOURS_INPUT_PATTERN})$`).test(raw)) {
    throw new ValidationError('Enter hours as a non-negative number, e.g. 1.5.');
  }
  const minutes = hoursToMinutes(Number(raw.replace(',', '.')));
  if (!isValidMinutes(minutes)) throw new ValidationError('Time is out of range.');
  return minutes;
}

export function readCost(value: FormDataEntryValue | null): number {
  const raw = optionalText(value).replace(/\s/g, '');
  if (raw === '') return 0;
  if (!/^[0-9]*([.,][0-9]{1,2})?$/.test(raw)) {
    throw new ValidationError('Enter a non-negative cost with at most two decimal places.');
  }
  const cost = Number(raw.replace(',', '.'));
  if (!Number.isFinite(cost) || cost > 99_999_999.99) {
    throw new ValidationError('Estimated cost is out of range.');
  }
  return Math.round(cost * 100) / 100;
}

export function readOptionalCost(value: FormDataEntryValue | null): number | null {
  const raw = optionalText(value);
  return raw === '' ? null : readCost(raw);
}

export function readStoreUrl(value: FormDataEntryValue | null): string | null {
  const raw = optionalText(value);
  if (raw === '') return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    throw new ValidationError('Store URL is not a valid URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ValidationError('Store URL must start with http:// or https://.');
  }
  return url.toString();
}
