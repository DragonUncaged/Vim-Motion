// Every practice mode shares the one [drill] segment (docs/CONTRACT.md §8); slugs and ids contain no dots.

export const SPEEDRUN_PREFIX = 'speedrun';

export type DrillRoute =
  { mode: 'drill'; categoryId: string } | { mode: 'speedrun'; itemKey: string | null };

export function parseDrillSegment(segment: string): DrillRoute {
  const decoded = decodeURIComponent(segment);
  if (decoded === SPEEDRUN_PREFIX) return { mode: 'speedrun', itemKey: null };
  if (decoded.startsWith(`${SPEEDRUN_PREFIX}.`)) {
    const rest = decoded.slice(SPEEDRUN_PREFIX.length + 1);
    const dot = rest.indexOf('.');
    if (dot <= 0 || dot === rest.length - 1) return { mode: 'speedrun', itemKey: null };
    return { mode: 'speedrun', itemKey: `${rest.slice(0, dot)}/${rest.slice(dot + 1)}` };
  }
  return { mode: 'drill', categoryId: decoded };
}

export function drillHref(categoryId: string): string {
  return `/practice/${encodeURIComponent(categoryId)}`;
}

export function speedrunHref(key?: string): string {
  if (key === undefined) return `/practice/${SPEEDRUN_PREFIX}`;
  return `/practice/${encodeURIComponent(`${SPEEDRUN_PREFIX}.${key.replace('/', '.')}`)}`;
}
