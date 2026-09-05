import { globSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PATTERN = '**/__tests__/**/*.test.{ts,tsx}';
const SKIP = new Set(['node_modules', '.next']);

const files = globSync(PATTERN, { exclude: (name) => SKIP.has(name) }).sort();

if (files.length === 0) {
  console.error(`npm test: no test files matched ${PATTERN} — refusing to report green.`);
  process.exit(1);
}

const tapDir = mkdtempSync(join(tmpdir(), 'vim-clay-test-'));
const tapFile = join(tapDir, 'summary.tap');

const run = spawnSync(
  process.execPath,
  [
    '--experimental-strip-types',
    '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
    '--import',
    './scripts/node-test-resolver.mjs',
    '--test',
    '--test-reporter=spec',
    '--test-reporter-destination=stdout',
    '--test-reporter=tap',
    `--test-reporter-destination=${tapFile}`,
    ...files,
  ],
  { stdio: 'inherit' },
);

let summary = '';
try {
  summary = readFileSync(tapFile, 'utf8');
} finally {
  rmSync(tapDir, { recursive: true, force: true });
}

if (run.status !== 0) process.exit(run.status ?? 1);

// Node counts a file that declares no tests as one passing test, so find those in the TAP.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const empty = files.filter((f) =>
  new RegExp(`^# Subtest: ${escape(f)}\\n(?:not )?ok \\d+ - ${escape(f)}$`, 'm').test(summary),
);
const counted = Number(/^# tests (\d+)$/m.exec(summary)?.[1] ?? 0);
const ran = counted - empty.length;

if (empty.length > 0) {
  console.error(
    `npm test: ${empty.length} matched file(s) declared no tests — refusing to report green:\n` +
      empty.map((f) => `  ${f}`).join('\n'),
  );
  process.exit(1);
}

if (ran === 0) {
  console.error(
    `npm test: ${files.length} file(s) matched but no test ran — refusing to report green.`,
  );
  process.exit(1);
}

console.log(`\n${ran} tests across ${files.length} files.`);
