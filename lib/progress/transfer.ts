/** docs/CONTRACT.md §6 */

import {
  MAX_ATTEMPTS,
  PROGRESS_VERSION,
  emptyProgress,
  parseProgressBlob,
  type ProgressBlob,
} from './schema';
import { loadProgress, saveProgress } from './storage';

export const MAX_IMPORT_BYTES = 4 * 1024 * 1024;

export interface ProgressExport extends ProgressBlob {
  app: 'vim-clay';
  exportedAt: string;
}

export type ImportResult =
  { ok: true; imported: number; merged: number; total: number } | { ok: false; error: string };

export function exportProgress(): string {
  const blob = loadProgress();
  const payload: ProgressExport = {
    app: 'vim-clay',
    version: PROGRESS_VERSION,
    exportedAt: new Date().toISOString(),
    attempts: blob.attempts,
  };
  return JSON.stringify(payload, null, 2);
}

export function importProgress(json: string): ImportResult {
  if (typeof json !== 'string' || json.trim() === '') {
    return {
      ok: false,
      error: 'That file was empty. Pick the JSON file you exported from Vim Clay.',
    };
  }

  const bytes = new TextEncoder().encode(json).byteLength;
  if (bytes > MAX_IMPORT_BYTES) {
    return {
      ok: false,
      error:
        `That file is ${Math.round(bytes / (1024 * 1024))} MB, and no Vim Clay export is ` +
        `bigger than ${MAX_IMPORT_BYTES / (1024 * 1024)} MB. Pick the file you exported, unedited.`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      ok: false,
      error: 'That is not valid JSON. Pick the file you exported from Vim Clay, unedited.',
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      error: 'That JSON is not a Vim Clay export — it should be a single object.',
    };
  }

  const version = (parsed as Record<string, unknown>).version;
  if (version !== PROGRESS_VERSION) {
    return {
      ok: false,
      error:
        `That file says version ${String(version)}, and this build reads version ` +
        `${PROGRESS_VERSION}. Export again from the device that made it.`,
    };
  }

  const rows = (parsed as Record<string, unknown>).attempts;
  if (Array.isArray(rows) && rows.length > MAX_ATTEMPTS) {
    return {
      ok: false,
      error:
        `That file holds ${rows.length} attempts, and this site keeps at most ${MAX_ATTEMPTS}, ` +
        'so it cannot be one of its exports. Pick the file you exported, unedited.',
    };
  }

  const incoming = parseProgressBlob(parsed);
  if (incoming === null) {
    return { ok: false, error: 'That file is a Vim Clay export but its contents are unreadable.' };
  }
  if (incoming.attempts.length === 0) {
    return {
      ok: false,
      error: 'That export has no attempts in it, so there is nothing to import.',
    };
  }

  const existing = loadProgress();
  const seen = new Set(existing.attempts.map((a) => `${a.lessonSlug}/${a.exerciseId}@${a.at}`));
  const added = incoming.attempts.filter(
    (a) => !seen.has(`${a.lessonSlug}/${a.exerciseId}@${a.at}`),
  );

  const merged: ProgressBlob = {
    version: PROGRESS_VERSION,
    attempts: [...existing.attempts, ...added].sort((a, b) => a.at - b.at),
  };

  if (!saveProgress(merged)) {
    return {
      ok: false,
      error: 'Your browser would not let this page store data, so the import was not saved.',
    };
  }

  return {
    ok: true,
    imported: incoming.attempts.length,
    merged: added.length,
    total: merged.attempts.length,
  };
}

export function exportFilename(now: Date = new Date()): string {
  return `vim-clay-progress-${now.toISOString().slice(0, 10)}.json`;
}

export { emptyProgress };
