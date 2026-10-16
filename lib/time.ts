/** One year; anything larger is a typo, not a renovation task. */
export const MAX_MINUTES = 60 * 24 * 365;

export const HOURS_INPUT_PATTERN = '[0-9]*([.,][0-9]{1,2})?';

export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

export function isValidMinutes(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_MINUTES;
}

/** 90 -> "1h 30m", 60 -> "1h", 45 -> "45m". */
export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

const WORKDAY_MINUTES = 8 * 60;
const workdayFormatter = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 1 });

/** 1500 -> "≈ 3,1 workdays" (8h days). Empty below one workday. */
export function formatWorkdays(totalMinutes: number): string | undefined {
  if (totalMinutes < WORKDAY_MINUTES) return undefined;
  return `≈ ${workdayFormatter.format(totalMinutes / WORKDAY_MINUTES)} workdays`;
}
