import type { DrillItem } from './types';

export function itemByKey(pool: DrillItem[], key: string): DrillItem | undefined {
  return pool.find((item) => item.key === key);
}
