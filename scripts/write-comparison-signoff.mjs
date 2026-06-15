/**
 * Write Comparison_Out/SIGNOFF.md after regeneration + pdf-ui-audit-all.
 * Usage: node scripts/write-comparison-signoff.mjs
 */
import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { spawnSync } from 'child_process';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'Comparison_Out');
const LOG = join(ROOT, 'comparison_regen_run.log');

function collectPngs(dir, acc = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) collectPngs(p, acc);
    else if (name.name.startsWith('comparison_') && name.name.endsWith('.png')) {
      const st = statSync(p);
      acc.push({
        rel: relative(OUT, p).replace(/\\/g, '/'),
        bytes: st.size,
        mtime: st.mtime.toISOString().slice(0, 16).replace('T', ' '),
      });
    }
  }
  return acc;
}

const audit = spawnSync('node', ['scripts/pdf-ui-audit-all.mjs', 'http://localhost:3000'], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: true,
});

const pngs = existsSync(OUT) ? collectPngs(OUT).sort((a, b) => a.rel.localeCompare(b.rel)) : [];
const regenLog = existsSync(LOG) ? readFileSync(LOG, 'utf8') : '';
const regenErrors = [...regenLog.matchAll(/ERROR — (.+)/g)].map((m) => m[1]);
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

const lines = [
  '# Visual sign-off — PDF vs localhost',
  '',
  `**Generated:** ${stamp}`,
  '',
  '## How to review',
  '',
  '1. Open [`index.html`](./index.html) in a browser (side-by-side PNGs).',
  '2. PDF reference files are in [`PDFs/`](./PDFs/).',
  '3. Automated checks below ran against live `http://localhost:3000`.',
  '',
  '## Regeneration summary',
  '',
  `| Metric | Value |`,
  `|--------|-------|`,
  `| Screens packaged | **${pngs.length}** PNG files in \`Comparison_Out/\` |`,
  `| Playwright errors | **${regenErrors.length}** |`,
  '',
];

if (regenErrors.length) {
  lines.push('### Regeneration warnings', '');
  regenErrors.forEach((e) => lines.push(`- ${e}`));
  lines.push('');
}

lines.push('## Screen index', '', '| PNG | Updated | Size |', '|-----|---------|------|');
pngs.forEach((p) => {
  lines.push(`| \`${p.rel}\` | ${p.mtime} | ${Math.round(p.bytes / 1024)} KB |`);
});

lines.push('', '## Automated UI checks (localhost)', '', '```');
lines.push(audit.stdout || '(no output)');
if (audit.stderr) lines.push(audit.stderr);
lines.push('```', '');

lines.push('## Known acceptable deltas vs PDF (not blockers)', '', '| Item | Notes |', '|------|-------|');
const deltas = [
  ['Song card width', '~209px vs PDF 280px (`--ajab-card-w`)'],
  ['Home news popup', 'Auto-opens when CMS slides exist'],
  ['Songs theme filter', 'Chips selectable but grid not filtered yet'],
  ['About / Glossary', 'Mock when CMS placeholders fail quality gate'],
  ['Radio', 'Mock UI until `/Api/radio` exists'],
  ['Search', 'Weak songs/poems hits — CMS indexing'],
  ['Poem detail', 'Not in comparison script — no side-by-side PNG'],
];
deltas.forEach(([item, notes]) => lines.push(`| ${item} | ${notes} |`));

lines.push('', '## Sign-off checklist', '', '- [ ] All 34 comparison PNGs reviewed in `index.html`');
lines.push('- [ ] Songs listing: no pink filter chips on page (drawer only)');
lines.push('- [ ] Song detail: about uses `...more`, not scroll box');
lines.push('- [ ] Header ABOUT matches other nav links + dropdown works');
lines.push('- [ ] CMS/data gaps documented in `docs/BACKEND_API_ISSUES.md`');

writeFileSync(join(OUT, 'SIGNOFF.md'), lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${join(OUT, 'SIGNOFF.md')}`);
console.log(`Screens: ${pngs.length}, audit exit: ${audit.status}`);
