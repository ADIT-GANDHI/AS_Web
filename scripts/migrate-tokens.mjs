// Token migration sweep: walk every source CSS file under app/, components/,
// styles/ (excluding globals.css where tokens are DEFINED) and rewrite
// hardcoded brand colours, font-family stacks and standard font-size values
// to reference the `--ajab-*` custom properties declared in app/globals.css.
//
// Usage:
//   node scripts/migrate-tokens.mjs            # apply changes (in-place)
//   node scripts/migrate-tokens.mjs --dry      # report only, no writes
//
// Safety:
//   - We never touch app/globals.css or styles/globals.css (token sources).
//   - Colour substitutions are exact-hex (case-insensitive) → there's no risk
//     of accidentally rewriting an unrelated value.
//   - Font-family substitutions match ONLY the full stack
//       'Lora', serif        →  var(--ajab-font-serif)
//       'Merriweather Sans', sans-serif → var(--ajab-font-sans)
//     so @font-face declarations (which don't include the fallback) are safe.
//   - Font-size substitutions match `font-size:` declarations only.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DRY = process.argv.includes('--dry');

const COLOUR_MAP = [
  // Brand pink (3 closely-related shades)
  [/#e31e79\b/gi, 'var(--ajab-pink-primary)'],
  [/#e6287a\b/gi, 'var(--ajab-pink-card)'],
  [/#e6257a\b/gi, 'var(--ajab-pink-card)'], // typo of E6287A in Reflections/Poems
  [/#ed1e79\b/gi, 'var(--ajab-pink-related)'],
  // Ink (greyscale)
  [/#333333\b/gi, 'var(--ajab-ink-950)'],
  [/#3c3c3b\b/gi, 'var(--ajab-ink-900)'],
  [/#4d4d4d\b/gi, 'var(--ajab-ink-800)'],
  [/#4f4f4f\b/gi, 'var(--ajab-ink-700)'],
  [/#575756\b/gi, 'var(--ajab-ink-600)'],
  [/#6d6e71\b/gi, 'var(--ajab-ink-500)'],
  [/#6d6f71\b/gi, 'var(--ajab-ink-500)'], // typo of 6D6E71 found in CLSongDetails
  [/#6f6f72\b/gi, 'var(--ajab-ink-400)'],
  [/#6f6f6e\b/gi, 'var(--ajab-ink-400)'], // near-identical variant
  [/#6f7071\b/gi, 'var(--ajab-ink-400)'], // near-identical variant
  [/#6f7072\b/gi, 'var(--ajab-ink-400)'], // near-identical variant
  [/#6d7172\b/gi, 'var(--ajab-ink-400)'], // near-identical variant
  [/#828282\b/gi, 'var(--ajab-ink-300)'],
  [/#9c9b9b\b/gi, 'var(--ajab-ink-200)'],
  [/#b1b1b1\b/gi, 'var(--ajab-ink-100)'],
];

// Font-family substitutions:
//   - Match the stack WITH the generic fallback ('Lora', serif).
//   - Also match the bare quoted name ('Lora') for files that omit the
//     fallback. The token var(--ajab-font-serif) expands to the full
//     stack, so this is a strict improvement (adds the fallback).
//   - The negative-lookbehind `(?<![:;}])\s*['"]Lora['"](?!\s*,)` would
//     be ideal to skip @font-face declarations, but our SKIP set already
//     excludes the two globals.css files where @font-face lives.
const FONT_FAMILY_MAP = [
  [
    /font-family:\s*['"]Lora['"]\s*,\s*serif/gi,
    'font-family: var(--ajab-font-serif)',
  ],
  [
    /font-family:\s*['"]Lora['"]\s*(?=[;\s}])/gi,
    'font-family: var(--ajab-font-serif)',
  ],
  [
    /font-family:\s*['"]Merriweather Sans['"]\s*,\s*sans-serif/gi,
    'font-family: var(--ajab-font-sans)',
  ],
  [
    /font-family:\s*['"]Merriweather Sans['"]\s*(?=[;\s}])/gi,
    'font-family: var(--ajab-font-sans)',
  ],
];

// Font-size declarations only — never touch other px values
const FONT_SIZE_MAP = [
  [/font-size:\s*34px\b/g,  'font-size: var(--ajab-fs-display)'],
  [/font-size:\s*32px\b/g,  'font-size: var(--ajab-fs-h1)'],
  [/font-size:\s*30px\b/g,  'font-size: var(--ajab-fs-h2)'],
  [/font-size:\s*28px\b/g,  'font-size: var(--ajab-fs-h3)'],
  [/font-size:\s*26px\b/g,  'font-size: var(--ajab-fs-h4)'],
  [/font-size:\s*24px\b/g,  'font-size: var(--ajab-fs-h5)'],
  [/font-size:\s*22px\b/g,  'font-size: var(--ajab-fs-h6)'],
  [/font-size:\s*21px\b/g,  'font-size: var(--ajab-fs-button)'],
  [/font-size:\s*20px\b/g,  'font-size: var(--ajab-fs-body-lg)'],
  [/font-size:\s*18px\b/g,  'font-size: var(--ajab-fs-body)'],
  [/font-size:\s*16px\b/g,  'font-size: var(--ajab-fs-body-sm)'],
  [/font-size:\s*15px\b/g,  'font-size: var(--ajab-fs-caption)'],
  [/font-size:\s*14px\b/g,  'font-size: var(--ajab-fs-tag)'],
  [/font-size:\s*12px\b/g,  'font-size: var(--ajab-fs-micro)'],
  [/font-size:\s*11px\b/g,  'font-size: var(--ajab-fs-nano)'],
];

const ALL_MAPS = [
  ['colour', COLOUR_MAP],
  ['font',   FONT_FAMILY_MAP],
  ['size',   FONT_SIZE_MAP],
];

const SCAN_DIRS = ['app', 'components', 'styles'];
const SKIP = new Set([
  // Token DEFINITIONS live here — never rewrite the source of truth
  path.normalize('app/globals.css'),
  path.normalize('styles/globals.css'),
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && full.endsWith('.css')) out.push(full);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));

const report = [];
let totalSubs = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  if (SKIP.has(path.normalize(rel))) continue;

  const original = fs.readFileSync(file, 'utf8');
  let body = original;
  const counts = { colour: 0, font: 0, size: 0 };

  for (const [bucket, maps] of ALL_MAPS) {
    for (const [re, replacement] of maps) {
      body = body.replace(re, () => {
        counts[bucket]++;
        return replacement;
      });
    }
  }

  const total = counts.colour + counts.font + counts.size;
  if (total === 0) continue;

  if (!DRY) fs.writeFileSync(file, body);
  totalSubs += total;
  report.push({ rel, ...counts, total });
}

report.sort((a, b) => b.total - a.total);

console.log('');
console.log(DRY ? 'Token migration (DRY RUN — no writes):' : 'Token migration applied:');
console.log('');
console.log(['  total', 'colour', '  font', '  size', '  file'].join('  '));
console.log('  ' + '-'.repeat(70));
for (const r of report) {
  console.log(
    '  ' +
      String(r.total).padStart(5) +
      '  ' + String(r.colour).padStart(6) +
      '  ' + String(r.font).padStart(4) +
      '  ' + String(r.size).padStart(4) +
      '  ' + r.rel,
  );
}
console.log('  ' + '-'.repeat(70));
console.log(`  files updated: ${report.length}`);
console.log(`  total substitutions: ${totalSubs}`);
