import { readFileSync, existsSync, globSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const MANIFEST = '.next/app-build-manifest.json';

export const LANDING = '/page';

// Markers must survive minification: DOM class names or exported bindings, never package paths.
export const EDITOR_MARKERS = ['cm-editor', 'cm-content', 'cm-vim', 'visualBlock'];

export const PARSER_MARKERS = ['javascriptLanguage', 'goLanguage', 'cppLanguage'];

// Lesson text, not field names: `startDoc` as a key appears wherever lib/engine reads one.
export const CURRICULUM_MARKERS = [
  'Modes decide what your keys mean.',
  'Press [[i]] to enter insert mode.',
];

export const BUDGET_GZ = 115 * 1024;

/**
 * @param {Record<string, string[]>} pages
 * @param {(chunk: string) => string} readChunk
 * @returns {string[]}
 */
export function firstLoadProblems(pages, readChunk) {
  const problems = [];
  for (const [route, chunks] of Object.entries(pages)) {
    for (const chunk of chunks) {
      const text = readChunk(chunk);

      for (const marker of PARSER_MARKERS) {
        if (!text.includes(marker)) continue;
        problems.push(
          `${chunk} contains "${marker}" and is in ${route}'s First Load — a syntax mode is ` +
            `bundled instead of fetched. Load it through components/editor/languages.ts, ` +
            `never with a static import of @codemirror/lang-*.`,
        );
      }

      for (const marker of CURRICULUM_MARKERS) {
        if (!text.includes(marker)) continue;
        problems.push(
          `${chunk} contains lesson text (${JSON.stringify(marker)}) and is in ${route}'s ` +
            `First Load — the whole curriculum is bundled into this route. A client ` +
            `component is value-importing @/content/lessons or lib/drills/pool; take the ` +
            `catalogue or the drill cards as props from the server page instead.`,
        );
      }

      if (route !== LANDING) continue;
      for (const marker of EDITOR_MARKERS) {
        if (!text.includes(marker)) continue;
        problems.push(
          `${chunk} contains "${marker}" — CodeMirror has leaked into ${LANDING}'s First ` +
            `Load. Something the landing page reaches value-imports the editor; make it an ` +
            `\`import type\`, or move it behind components/landing/HeroEditorMount.`,
        );
      }
    }
  }
  return problems;
}

/**
 * @param {string[]} allChunkText
 * @returns {string[]}
 */
export function controlProblems(allChunkText) {
  return [...EDITOR_MARKERS, ...PARSER_MARKERS, ...CURRICULUM_MARKERS]
    .filter((marker) => !allChunkText.some((text) => text.includes(marker)))
    .map(
      (marker) =>
        `No chunk in this build contains "${marker}", so searching for it proves nothing. ` +
        `Either that code stopped shipping or minification changed the string — fix the ` +
        `marker rather than deleting the check.`,
    );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  /** @param {string[]} lines */
  const fail = (lines) => {
    console.error(`\nBundle check failed:\n${lines.map((l) => `  ✗ ${l}`).join('\n')}\n`);
    process.exit(1);
  };

  if (!existsSync(MANIFEST)) fail([`${MANIFEST} is missing — run \`npm run build\` first.`]);

  /** @type {{ pages: Record<string, string[]> }} */
  const { pages } = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  if (!pages?.[LANDING]?.length) {
    fail([`${MANIFEST} lists no chunks for ${LANDING}; the manifest shape changed.`]);
  }

  const missing = Object.entries(pages).flatMap(([route, chunks]) =>
    chunks
      .filter((chunk) => !existsSync(`.next/${chunk}`))
      .map((chunk) => `${chunk} is in the manifest for ${route} but not on disk.`),
  );
  if (missing.length) fail(missing);

  const problems = [
    ...firstLoadProblems(pages, (chunk) => readFileSync(`.next/${chunk}`, 'utf8')),
    ...controlProblems(
      globSync('.next/static/chunks/**/*.js').map((path) => readFileSync(path, 'utf8')),
    ),
  ];

  const landing = pages[LANDING];
  let gz = 0;
  let raw = 0;
  for (const chunk of landing) {
    const source = readFileSync(`.next/${chunk}`);
    raw += source.length;
    gz += gzipSync(source).length;
  }
  if (gz > BUDGET_GZ) {
    problems.push(
      `${LANDING} First Load is ${(gz / 1024).toFixed(1)} kB gz over ${landing.length} chunks, ` +
        `above the ${(BUDGET_GZ / 1024).toFixed(0)} kB budget.`,
    );
  }

  if (problems.length) fail(problems);

  console.log(
    `Bundle check: ${LANDING} First Load is ${landing.length} chunks, ` +
      `${(gz / 1024).toFixed(1)} kB gz (${(raw / 1024).toFixed(1)} kB raw), no CodeMirror in ` +
      `it; no syntax parser and no curriculum in any of ${Object.keys(pages).length} ` +
      `routes' First Load.`,
  );
}
