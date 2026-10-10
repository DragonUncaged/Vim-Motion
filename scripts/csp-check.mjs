import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  CATCH_ALL,
  HASHES_FILE,
  collectHashes,
  inlineScriptHashes,
  prerenderedPages,
} from './csp-hashes.mjs';

const MANIFEST = '.next/routes-manifest.json';

// Lower-cased, as Node reports header keys.
export const REQUIRED_HEADERS = [
  'content-security-policy',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'x-frame-options',
  'strict-transport-security',
];

const UNKNOWN_PATH = '/csp-check/not-a-page';

/**
 * @typedef {{ source: string; regex: string; headers: { key: string; value: string }[] }} HeaderRule
 */

/**
 * Mirrors Next's resolve-routes: every matching rule applies in order and a later key overwrites.
 * @param {HeaderRule[]} rules
 * @param {string} path
 * @returns {Map<string, string>}
 */
export function effectiveHeaders(rules, path) {
  const out = new Map();
  for (const rule of rules) {
    if (!new RegExp(rule.regex).test(path)) continue;
    for (const { key, value } of rule.headers) out.set(key.toLowerCase(), value);
  }
  return out;
}

/**
 * @param {string} csp
 * @returns {Set<string>}
 */
export function scriptHashesIn(csp) {
  const directive = csp
    .split(';')
    .map((part) => part.trim())
    .find((part) => part === 'script-src' || part.startsWith('script-src '));
  if (directive === undefined) return new Set();
  return new Set(directive.split(/\s+/).filter((token) => token.startsWith("'sha256-")));
}

/**
 * @param {{ manifestPath?: string; hashesPath?: string; appDir?: string }} [paths]
 * @returns {string[]}
 */
export function checkBuild({ manifestPath = MANIFEST, hashesPath = HASHES_FILE, appDir } = {}) {
  /** @type {string[]} */
  const problems = [];

  const built = collectHashes(appDir);
  /** @type {Record<string, string[]>} */
  const committed = existsSync(hashesPath) ? JSON.parse(readFileSync(hashesPath, 'utf8')) : {};
  for (const route of new Set([...Object.keys(built), ...Object.keys(committed)])) {
    const want = built[route]?.join(' ');
    const have = committed[route]?.join(' ');
    if (want === undefined)
      problems.push(`${hashesPath} lists ${route}, which this build does not prerender`);
    else if (have === undefined) problems.push(`${hashesPath} has no entry for ${route}`);
    else if (want !== have) problems.push(`${hashesPath} is stale for ${route}`);
  }

  /** @type {{ headers: HeaderRule[] }} */
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const { route, file } of prerenderedPages(appDir)) {
    const path = route === CATCH_ALL ? UNKNOWN_PATH : route;
    const headers = effectiveHeaders(manifest.headers, path);
    for (const key of REQUIRED_HEADERS) {
      if (!headers.has(key)) problems.push(`${path} is served without ${key}`);
    }
    const allowed = scriptHashesIn(headers.get('content-security-policy') ?? '');
    const missing = inlineScriptHashes(readFileSync(file, 'utf8')).filter((h) => !allowed.has(h));
    if (missing.length > 0) {
      problems.push(
        `${path} carries ${missing.length} inline script(s) its Content-Security-Policy does not allow: ${missing.join(' ')}`,
      );
    }
  }
  return problems;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = checkBuild();
  const pages = prerenderedPages().length;
  if (problems.length === 0) {
    console.log(
      `CSP check: ${pages} prerendered pages, every inline script allowed by the header it is served with.`,
    );
  } else {
    console.error(
      `CSP check failed — ${problems.length} problem(s) across ${pages} prerendered pages:\n`,
    );
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    console.error(
      `\nIf pages changed, the set is stale: run \`npm run csp:hashes\`, then \`npm run build\` again, and commit ${HASHES_FILE}.` +
        `\nIf the set is current, next.config.ts is not serving it — see the comment on headers() there.`,
    );
    process.exit(1);
  }
}
