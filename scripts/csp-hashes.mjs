// No nonce: Next renders a nonce'd page per request, which would make every page dynamic.

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const APP_DIR = '.next/server/app';
export const HASHES_FILE = 'csp-hashes.json';
export const CATCH_ALL = '/(.*)';

// Node's request-header limit is 16 KB; the largest set today is about 1.1 KB.
const MAX_DIRECTIVE_BYTES = 6 * 1024;

// The browser hashes the raw bytes between the tags; script content is not entity-decoded.
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

/**
 * @param {string} html
 * @returns {string[]}
 */
export function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const match of html.matchAll(INLINE_SCRIPT)) {
    hashes.add(`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
  }
  return [...hashes].sort();
}

/**
 * @param {string} file
 * @returns {string}
 */
export function routeOf(file) {
  const path = file
    .split(sep)
    .join('/')
    .replace(/\.html$/, '');
  if (path === 'index') return '/';
  if (path === '_not-found') return CATCH_ALL;
  return `/${path}`;
}

/**
 * @param {string} [dir]
 * @returns {{ route: string; file: string }[]}
 */
export function prerenderedPages(dir = APP_DIR) {
  /** @type {string[]} */
  const files = [];
  const walk = (/** @type {string} */ current) => {
    for (const entry of readdirSync(current)) {
      const path = join(current, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (entry.endsWith('.html')) files.push(path);
    }
  };
  walk(dir);
  return files
    .map((file) => ({ route: routeOf(relative(dir, file)), file }))
    .sort((a, b) => (a.route < b.route ? -1 : a.route > b.route ? 1 : 0));
}

/**
 * @param {string} [dir]
 * @returns {Record<string, string[]>}
 */
export function collectHashes(dir = APP_DIR) {
  /** @type {Record<string, string[]>} */
  const out = {};
  const pages = prerenderedPages(dir);
  if (pages.length === 0)
    throw new Error(`No prerendered pages under ${dir}. Run \`npm run build\` first.`);
  for (const { route, file } of pages) {
    if (route !== CATCH_ALL && !/^\/[A-Za-z0-9._\-/]*$/.test(route)) {
      throw new Error(`Route ${route} has characters path-to-regexp would treat as syntax.`);
    }
    const hashes = inlineScriptHashes(readFileSync(file, 'utf8'));
    if (hashes.length === 0)
      throw new Error(
        `${file} has no inline script; every page carries the theme script, so the build output is not what this expects.`,
      );
    const bytes = Buffer.byteLength(hashes.join(' '));
    if (bytes > MAX_DIRECTIVE_BYTES)
      throw new Error(
        `${route} needs ${bytes} bytes of hashes; the ceiling is ${MAX_DIRECTIVE_BYTES}.`,
      );
    out[route] = hashes;
  }
  if (!(CATCH_ALL in out))
    throw new Error('No _not-found.html in the build output; the catch-all would have no hashes.');
  return out;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const hashes = collectHashes();
  writeFileSync(HASHES_FILE, `${JSON.stringify(hashes, null, 2)}\n`);
  const routes = Object.keys(hashes);
  const counts = routes.map((route) => hashes[route].length);
  console.log(
    `Wrote ${HASHES_FILE}: ${routes.length} routes, ${Math.min(...counts)}–${Math.max(...counts)} hashes each, ` +
      `${hashes[CATCH_ALL].length} on the catch-all.`,
  );
  console.log(
    'Now run `npm run build` again so the header rules carry this set, and commit the file.',
  );
}
