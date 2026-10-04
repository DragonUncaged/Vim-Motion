/**
 * Every icon and the social card. The output is committed: change the geometry and palette here and re-run.
 * The cap is --clay-violet-deep so the pale block clears 4.5:1 on a light tab strip and carries the mark on a dark one.
 * Needs sharp, which arrives undeclared as an optionalDependency of next.
 */

import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error(
    'generate-icons: `sharp` is not installed.\n' +
      'It normally arrives with next, as an optionalDependency. To run this script alone:\n' +
      '  npm install --no-save sharp\n' +
      'The committed icons are unchanged.',
  );
  process.exit(1);
}

const C = {
  capTop: '#8b7df2',
  capMid: '#7263ea',
  capBase: '#5b47d6', // --clay-violet-deep
  shade: '#34277f', // --clay-violet-ink
  block: '#f5f4ff', // --clay-surface
  ground: '#e9e7fb', // --clay-bg
  ink: '#241f42', // --clay-ink
  inkSoft: '#5f5892', // --clay-ink-soft
  violet: '#7b6bf0', // --clay-violet
};

// A 32-unit grid: two units are one device pixel at 16x16, so every edge sits on an even unit.
const VB = 32;

// r/side 0.219: rounder reads as a circle at 16px.
const CAP_R = 7;

// One device pixel at 16x16; thicker reads as a white stripe.
const EDGE_H = 2;
const EDGE_ALPHA = 0.55;

const FOOT_H = 9;
const FOOT_ALPHA = 0.45;

// 2:3 on purpose: a 4px-wide 1:2 block reads as a bar, which is vim's insert cursor.
const BLOCK = { w: 8, h: 12, r: 1.5 };

function capMarkup(fraction, id) {
  const scale = fraction;
  const offset = (VB - VB * scale) / 2;
  const cap = `x="0" y="0" width="${VB}" height="${VB}" rx="${CAP_R}"`;

  const open =
    scale === 1
      ? '  <g>'
      : `  <g transform="translate(${round(offset)} ${round(offset)}) scale(${round(scale)})">`;

  return `  <defs>
    <linearGradient id="body-${id}" x1="0" y1="0" x2="0" y2="${VB}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${C.capTop}"/>
      <stop offset="0.45" stop-color="${C.capMid}"/>
      <stop offset="1" stop-color="${C.capBase}"/>
    </linearGradient>
    <radialGradient id="crown-${id}" cx="16" cy="8" r="15" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1 0 0 0.6 0 3.2)">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="foot-${id}" x1="0" y1="${VB - FOOT_H}" x2="0" y2="${VB}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${C.shade}" stop-opacity="0"/>
      <stop offset="1" stop-color="${C.shade}" stop-opacity="${FOOT_ALPHA}"/>
    </linearGradient>
    <linearGradient id="edge-${id}" x1="0" y1="0" x2="0" y2="${EDGE_H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="${EDGE_ALPHA}"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
${open}
    <rect ${cap} fill="url(#body-${id})"/>
    <rect ${cap} fill="url(#crown-${id})"/>
    <rect ${cap} fill="url(#foot-${id})"/>
    <rect ${cap} fill="url(#edge-${id})"/>
    <rect x="${(VB - BLOCK.w) / 2}" y="${(VB - BLOCK.h) / 2}" width="${BLOCK.w}" height="${BLOCK.h}" rx="${BLOCK.r}" fill="${C.block}"/>
  </g>`;
}

function round(n) {
  return Number(n.toFixed(4));
}

/**
 * @param {object} opts
 * @param {number} opts.fraction
 * @param {string} [opts.ground]
 * @param {number} [opts.px] sets width/height so librsvg rasterises at the target size
 * @param {string} opts.id
 */
function icon({ fraction, ground, px, id }) {
  const size = px ? ` width="${px}" height="${px}"` : '';
  const plate = ground ? `\n  <rect width="${VB}" height="${VB}" fill="${ground}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}"${size} role="img" aria-label="Vim Clay">${plate}
${capMarkup(fraction, id)}
</svg>
`;
}

const TIGHT = 1;

const APPLE = 0.72;

// Android's maskable safe zone is a circle of 80% of the tile, which caps this rounded square at 0.649.
const MASKABLE = 0.62;

async function write(out, buf) {
  const path = join(ROOT, out);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buf);
  console.log(`  ${relative(ROOT, path).padEnd(34)}${buf.length.toLocaleString()} bytes`);
}

function render(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

function raw(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).ensureAlpha().raw().toBuffer();
}

// ICO still demands the 1-bpp AND mask after the DIB.
function dib(rgba, size) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8); // doubled: colour rows, then mask rows
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  header.writeUInt32LE(0, 16);

  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const src = (size - 1 - y) * size * 4; // DIB rows run bottom-up
    const dst = y * size * 4;
    for (let x = 0; x < size; x++) {
      pixels[dst + x * 4 + 0] = rgba[src + x * 4 + 2];
      pixels[dst + x * 4 + 1] = rgba[src + x * 4 + 1];
      pixels[dst + x * 4 + 2] = rgba[src + x * 4 + 0];
      pixels[dst + x * 4 + 3] = rgba[src + x * 4 + 3];
    }
  }

  const mask = Buffer.alloc(size * Math.ceil(size / 8 / 4) * 4);
  return Buffer.concat([header, pixels, mask]);
}

async function ico(svg, sizes, out) {
  const images = [];
  for (const size of sizes) images.push(dib(await raw(svg, size), size));

  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(sizes.length, 4);

  let offset = 6 + sizes.length * 16;
  const dir = sizes.map((size, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size, 0);
    e.writeUInt8(size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(images[i].length, 8);
    e.writeUInt32LE(offset, 12);
    offset += images[i].length;
    return e;
  });

  await write(out, Buffer.concat([head, ...dir, ...images]));
}

// Proof sheets magnify nearest-neighbour on purpose: smoothing would hide the pixel decisions.
const SANS = 'ui-sans-serif, system-ui, Helvetica, Arial, sans-serif';

async function magnified(svg, size, zoom) {
  return sharp(await raw(svg, size), { raw: { width: size, height: size, channels: 4 } })
    .resize(size * zoom, size * zoom, { kernel: 'nearest' })
    .png()
    .toBuffer();
}

async function tabStripSheet(svg) {
  const SIZES = [16, 32, 48];
  const ZOOM = 6;
  const GAP = 36;
  const PAD = 32;
  const TALLEST = SIZES[SIZES.length - 1] * ZOOM;
  const HEAD = 84;
  const strips = [
    { label: 'Light tab strip — #ffffff', bg: '#ffffff', ink: '#241f42' },
    { label: 'Dark tab strip — #202124', bg: '#202124', ink: '#f5f4ff' },
  ];

  const colX = [];
  let x = PAD;
  for (const size of SIZES) {
    colX.push(x);
    x += size * ZOOM + GAP;
  }
  const width = x - GAP + PAD;
  const rowH = HEAD + TALLEST + 24 + 48 + PAD;
  const height = rowH * strips.length;

  const layers = [];
  const text = [];
  for (let r = 0; r < strips.length; r++) {
    const top = r * rowH;
    text.push(
      `<rect x="0" y="${top}" width="${width}" height="${rowH}" fill="${strips[r].bg}"/>`,
      `<text x="${PAD}" y="${top + 40}" font-family="${SANS}" font-size="18" font-weight="600" fill="${strips[r].ink}">${strips[r].label}</text>`,
      `<text x="${PAD}" y="${top + 62}" font-family="${SANS}" font-size="13" fill="${strips[r].ink}" opacity="0.7">Each column: the icon at ${ZOOM}x, and the same file at 1:1 beneath it.</text>`,
    );
    for (let i = 0; i < SIZES.length; i++) {
      const size = SIZES[i];
      const imgTop = top + HEAD + (TALLEST - size * ZOOM);
      text.push(
        `<text x="${colX[i]}" y="${top + HEAD - 8}" font-family="${SANS}" font-size="13" font-weight="600" fill="${strips[r].ink}" opacity="0.7">${size}px</text>`,
      );
      layers.push(
        { input: await magnified(svg, size, ZOOM), left: colX[i], top: imgTop },
        { input: await render(svg, size), left: colX[i], top: top + HEAD + TALLEST + 24 },
      );
    }
  }

  const base = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${text.join('')}</svg>`;
  await write(
    'docs/icons/tab-strip.png',
    await sharp(Buffer.from(base)).composite(layers).png({ compressionLevel: 9 }).toBuffer(),
  );
}

async function maskableSheet() {
  const SIZE = 384;
  const PAD = 40;
  const W = 660;
  const H = SIZE + PAD + 108;
  const svg = icon({ fraction: MASKABLE, ground: C.ground, px: SIZE, id: 'm' });
  const left = Math.round((W - SIZE) / 2);
  const cx = left + SIZE / 2;
  const cy = PAD + SIZE / 2;

  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <circle cx="${cx}" cy="${cy}" r="${SIZE / 2}" fill="none" stroke="#5f5892" stroke-width="2" stroke-dasharray="3 5"/>
    <circle cx="${cx}" cy="${cy}" r="${SIZE * 0.4}" fill="none" stroke="#ff9aa8" stroke-width="2"/>
    <text x="${PAD}" y="${SIZE + PAD + 36}" font-family="${SANS}" font-size="15" font-weight="600" fill="#241f42">Maskable composition, shipped at 192 and 512 — the mark is 62% of the tile</text>
    <text x="${PAD}" y="${SIZE + PAD + 62}" font-family="${SANS}" font-size="13" fill="#ff9aa8">solid: Android's 80% safe circle — nothing crosses it</text>
    <text x="${PAD}" y="${SIZE + PAD + 84}" font-family="${SANS}" font-size="13" fill="#5f5892">dashed: the full-bleed circle mask, the tightest shape Android applies</text>
  </svg>`;

  const sheet = await sharp({
    create: { width: W, height: H, channels: 4, background: '#ffffff' },
  })
    .composite([
      { input: await render(svg, SIZE), left, top: PAD },
      { input: Buffer.from(overlay), left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await write('docs/icons/maskable-safe-zone.png', sheet);
}

// Keep content 80px from every edge: Twitter crops to 2:1 and Slack letterboxes.
const OG = { w: 1200, h: 630 };

// Explicit, not system-ui: the brand faces are hashed build artefacts, and a regeneration must match across machines.
const OG_SANS = "'Avenir Next', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const OG_MONO = "'SF Mono', Menlo, Consolas, 'DejaVu Sans Mono', monospace";

function ogMark(x, y, size) {
  const r = (CAP_R / VB) * size;
  return `  <g>
    <rect x="${x + size * 0.03}" y="${y + size * 0.14}" width="${size}" height="${size}" rx="${round(r)}" fill="${C.violet}" opacity="0.5" filter="url(#og-drop)"/>
    <rect x="${x + size * 0.03}" y="${y - size * 0.055}" width="${size * 0.94}" height="${size * 0.94}" rx="${round(r * 0.94)}" fill="#ffffff" opacity="0.7" filter="url(#og-bounce)"/>
    <svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 ${VB} ${VB}">
${capMarkup(TIGHT, 'og')}
    </svg>
  </g>`;
}

function ogKey(x, y, size, label) {
  const wide = label.length > 1 ? size * 0.45 : 0;
  const w = size + wide;
  return `    <g>
      <rect x="${x}" y="${y + size * 0.09}" width="${w}" height="${size}" rx="${round(size * 0.28)}" fill="${C.shade}" opacity="0.16" filter="url(#og-keydrop)"/>
      <rect x="${x}" y="${y}" width="${w}" height="${size}" rx="${round(size * 0.28)}" fill="${C.block}"/>
      <rect x="${x}" y="${y}" width="${w}" height="${size * 0.34}" rx="${round(size * 0.28)}" fill="#ffffff" opacity="0.75"/>
      <text x="${round(x + w / 2)}" y="${round(y + size * 0.68)}" text-anchor="middle" font-family="${OG_MONO}" font-size="${round(size * 0.46)}" font-weight="600" fill="${C.capBase}">${label}</text>
    </g>`;
}

const OG_MOTIONS = [
  ['d', 'w'],
  ['c', 'i', '{'],
  ['g', 'g'],
];

function ogKeyRow(x, y, size) {
  const gap = size * 0.16;
  const groupGap = size * 0.62;
  const out = [];
  let cursor = x;
  for (const group of OG_MOTIONS) {
    for (const label of group) {
      out.push(ogKey(cursor, y, size, label));
      cursor += size + gap;
    }
    cursor += groupGap - gap;
  }
  return out.join('\n');
}

function ogCard() {
  const MARK = { x: 96, y: 128, size: 236 };
  const TEXT_X = 408;
  const KEYS = { x: 100, y: 452, size: 62 };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG.w}" height="${OG.h}" viewBox="0 0 ${OG.w} ${OG.h}">
  <defs>
    <radialGradient id="og-bloom" cx="0.22" cy="0.3" r="0.75">
      <stop offset="0" stop-color="${C.violet}" stop-opacity="0.24"/>
      <stop offset="1" stop-color="${C.violet}" stop-opacity="0"/>
    </radialGradient>
    <filter id="og-drop" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${round(MARK.size * 0.1)}"/>
    </filter>
    <filter id="og-bounce" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${round(MARK.size * 0.05)}"/>
    </filter>
    <filter id="og-keydrop" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${round(KEYS.size * 0.09)}"/>
    </filter>
  </defs>
  <rect width="${OG.w}" height="${OG.h}" fill="${C.ground}"/>
  <rect width="${OG.w}" height="${OG.h}" fill="url(#og-bloom)"/>
${ogMark(MARK.x, MARK.y, MARK.size)}
  <text x="${TEXT_X}" y="252" font-family="${OG_SANS}" font-size="102" font-weight="700" fill="${C.ink}" letter-spacing="-2">Vim Clay</text>
  <text x="${TEXT_X}" y="318" font-family="${OG_SANS}" font-size="38" font-weight="500" fill="${C.inkSoft}">Learn vim motions in a real editor.</text>
  <text x="${TEXT_X}" y="366" font-family="${OG_SANS}" font-size="38" font-weight="500" fill="${C.inkSoft}">In your browser.</text>
${ogKeyRow(KEYS.x, KEYS.y, KEYS.size)}
  <text x="${OG.w - 100}" y="${KEYS.y + KEYS.size * 0.7}" text-anchor="end" font-family="${OG_SANS}" font-size="30" font-weight="600" fill="${C.inkSoft}">Free · no account · no backend</text>
</svg>
`;
}

async function main() {
  console.log('generate-icons');

  const primary = icon({ fraction: TIGHT, id: 'a' });
  await write('app/icon.svg', Buffer.from(primary));
  await ico(primary, [16, 32, 48], 'app/favicon.ico');

  await write(
    'app/apple-icon.png',
    await render(icon({ fraction: APPLE, ground: C.ground, px: 180, id: 'p' }), 180),
  );
  for (const size of [192, 512]) {
    await write(
      `public/icons/icon-${size}.png`,
      await render(icon({ fraction: MASKABLE, ground: C.ground, px: size, id: 'm' }), size),
    );
  }

  await write(
    'public/og.png',
    await sharp(Buffer.from(ogCard())).png({ compressionLevel: 9 }).toBuffer(),
  );

  await tabStripSheet(primary);
  await maskableSheet();
}

await main();
