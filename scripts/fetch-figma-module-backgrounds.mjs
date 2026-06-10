#!/usr/bin/env node
/**
 * Pull About + Radio background PNGs from Figma MCP asset URLs.
 * Design file: IJwbCASYYrrKaOSRDScXYV — refresh URLs via get_design_context when expired (~7d).
 *
 *   node scripts/fetch-figma-module-backgrounds.mjs
 */
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');

const ASSETS = {
  radio: {
    nodeId: '1:27179',
    url: 'https://www.figma.com/api/mcp/asset/1d250a1b-22af-4824-9575-59487009ddeb',
    out: 'radio-page-bg.png',
  },
  aboutTiles: [
    { nodeId: '367:10269', url: 'https://www.figma.com/api/mcp/asset/69dd621b-8a2f-4cbe-9898-c5c529daf681' },
    { nodeId: '367:10270', url: 'https://www.figma.com/api/mcp/asset/8da24d38-64c5-4b35-b4f0-5fb57a3b1adf' },
    { nodeId: '367:10271', url: 'https://www.figma.com/api/mcp/asset/e34fbefd-84c7-4a8e-b552-f51bcb4bf6c0' },
  ],
};

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await mkdir(publicDir, { recursive: true });

  const radio = await download(ASSETS.radio.url);
  await writeFile(join(publicDir, ASSETS.radio.out), radio);
  console.log(`Wrote ${ASSETS.radio.out} (${radio.length} bytes)`);

  const tmp = join(publicDir, '_about-tiles-tmp');
  await mkdir(tmp, { recursive: true });
  const tilePaths = [];
  for (let i = 0; i < ASSETS.aboutTiles.length; i++) {
    const buf = await download(ASSETS.aboutTiles[i].url);
    const p = join(tmp, `${i + 1}.png`);
    await writeFile(p, buf);
    tilePaths.push(p);
  }
  const out = join(publicDir, 'about-page-bg.png');
  const py = spawnSync(
    'python',
    [join(root, 'scripts', 'stitch-about-bg.py'), ...tilePaths, out],
    { stdio: 'inherit' },
  );
  await rm(tmp, { recursive: true, force: true });
  if (py.status !== 0) process.exit(py.status ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
