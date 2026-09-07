export const NO_VALUE = '—';

export function percent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return NO_VALUE;
  return `${Math.round(value)}%`;
}

export function fraction(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return NO_VALUE;
  return `${Math.round(value * 100)}%`;
}

export function duration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return NO_VALUE;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`;
}

export function longDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0s';
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s`;
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function rate(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return NO_VALUE;
  return count(Math.round(value));
}

export function count(value: number): string {
  return new Intl.NumberFormat('en').format(value);
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${count(n)} ${n === 1 ? one : many}`;
}

/** Intl.DateTimeFormat.format throws on an Invalid Date, so guard even what the schema already refuses. */
export function shortDate(at: number): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return NO_VALUE;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date);
}
