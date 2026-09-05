/** safeStorage never probe-writes: at exactly quota the probe was the write that failed. Neither function throws. */

export function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function storageWritable(storage: Storage): boolean {
  try {
    const probe = '__vimclay_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
