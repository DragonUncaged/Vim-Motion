export class FakeStorage {
  private map = new Map<string, string>();
  failWrites = false;
  limit: number | null = null;
  writes: string[] = [];

  get usage(): number {
    let total = 0;
    for (const [k, v] of this.map) total += k.length + v.length;
    return total;
  }

  getItem(k: string): string | null {
    return this.map.has(k) ? (this.map.get(k) as string) : null;
  }

  setItem(k: string, v: string): void {
    this.writes.push(k);
    if (this.failWrites) throw new Error('QuotaExceededError');
    if (this.limit !== null) {
      const current = this.map.has(k) ? k.length + (this.map.get(k) as string).length : 0;
      if (this.usage - current + k.length + v.length > this.limit) {
        throw new Error('QuotaExceededError');
      }
    }
    this.map.set(k, v);
  }

  removeItem(k: string): void {
    this.map.delete(k);
  }

  reset(): void {
    this.map.clear();
    this.failWrites = false;
    this.limit = null;
    this.writes = [];
  }
}

export interface FakeWindow {
  store: FakeStorage;
  deny(denied: boolean): void;
  fireStorageEvent(key: string | null): void;
}

export function installFakeWindow(): FakeWindow {
  const store = new FakeStorage();
  let denied = false;
  const listeners = new Set<(e: { key: string | null }) => void>();

  const window = {
    get localStorage(): FakeStorage {
      if (denied) throw new Error('SecurityError: The operation is insecure.');
      return store;
    },
    addEventListener(type: string, fn: (e: { key: string | null }) => void) {
      if (type === 'storage') listeners.add(fn);
    },
    removeEventListener(type: string, fn: (e: { key: string | null }) => void) {
      if (type === 'storage') listeners.delete(fn);
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test double for a browser global
  (globalThis as any).window = window;

  return {
    store,
    deny: (d) => {
      denied = d;
    },
    fireStorageEvent: (key) => {
      for (const fn of listeners) fn({ key });
    },
  };
}
