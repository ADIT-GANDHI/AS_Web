/**
 * Double verification pass for /radio and /radio?view=playlists
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = 'http://localhost:3000';
const OUT = 'Radio_Localhost_Comparison';
const VIEWPORTS = [
  [1980, 1114],
  [1620, 912],
  [1440, 810],
  [1240, 697],
  [1920, 1080],
  [1536, 864],
  [1366, 768],
  [1366, 600],
];

const PAGES = [
  { name: 'radio', url: '/radio', checks: 'radio' },
  { name: 'playlists', url: '/radio?view=playlists', checks: 'playlists' },
];

function fail(msg) {
  return { ok: false, msg };
}
function pass(msg) {
  return { ok: true, msg };
}

async function auditPage(page, cfg, vw, vh, passNum) {
  const results = [];
  const add = (id, r) => results.push({ id, passNum, viewport: `${vw}x${vh}`, ...r });

  await page.goto(BASE + cfg.url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);

  const data = await page.evaluate(() => {
    const wrap = document.querySelector('.radio-page-root-wrap');
    const root = document.querySelector('.radio-page-root');
    const player = document.querySelector('.radio-player');
    const sidebar = document.querySelector('.radio-panel--sidebar');
    const intro = document.querySelector('.radio-panel--intro');
    const artist = document.querySelector('.radio-panel--artist');
    const queue = document.querySelector('.radio-panel--queue');

    const wr = wrap?.getBoundingClientRect();
    const rr = root?.getBoundingClientRect();
    const pr = player?.getBoundingClientRect();
    const sr = sidebar?.getBoundingClientRect();

    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const wrapBg = wrap ? getComputedStyle(wrap).backgroundImage : '';
    const playerCs = player ? getComputedStyle(player) : null;

    return {
      viewport: { w: innerWidth, h: innerHeight },
      scrollH: document.documentElement.scrollHeight,
      wrap: wr
        ? { left: wr.left, width: wr.width, bottom: wr.bottom, height: wr.height }
        : null,
      root: rr ? { width: rr.width, bottom: rr.bottom } : null,
      player: pr
        ? {
            exists: true,
            left: pr.left,
            right: pr.right,
            bottom: pr.bottom,
            width: pr.width,
            height: pr.height,
            position: playerCs.position,
            bgColor: playerCs.backgroundColor,
            bgImage: playerCs.backgroundImage,
          }
        : { exists: false },
      sidebar: sr
        ? { top: sr.top, left: sr.left, width: sr.width, height: sr.height }
        : null,
      panels: {
        intro: !!intro,
        artist: !!artist,
        queue: !!queue,
        sidebarPanel: !!sidebar,
      },
      bodyBg,
      wrapHasRadioBg: wrapBg.includes('radio-page-bg') || wrapBg.includes('radio-playlist-bg'),
      tabs: {
        radio: document.querySelector('.radio-tab.is-active')?.textContent?.trim(),
      },
    };
  });

  const { w, h } = data.viewport;
  const maxScroll = Math.max(0, data.scrollH - h);
  const pageScrolls = maxScroll > 10;

  // Shared checks
  add('body-bg-cream', Math.abs(parseInt(data.bodyBg.split(',')[0].replace(/\D/g, '')) - 248) < 5
    ? pass(`body bg ${data.bodyBg}`)
    : fail(`body bg not cream: ${data.bodyBg}`));

  add('wrap-full-width', data.wrap && data.wrap.left <= 1 && Math.abs(data.wrap.width - w) < 2
    ? pass(`wrap width ${data.wrap.width}`)
    : fail(`wrap not full width: left=${data.wrap?.left} w=${data.wrap?.width} vw=${w}`));

  add('wrap-has-bg-image', data.wrapHasRadioBg ? pass('background image set') : fail('missing page bg'));

  add('no-horizontal-gap', data.wrap && data.wrap.left <= 1 && Math.abs(data.wrap.width - w) < 2
    ? pass('no side letterboxing on wrap')
    : fail('horizontal gap detected'));

  if (cfg.checks === 'radio') {
    add('player-exists', data.player.exists ? pass('player present') : fail('player missing'));
    add('no-fixed-player', data.player.exists && data.player.position === 'absolute'
      ? pass('player absolute (page footer)')
      : fail(`player position: ${data.player.position}`));
    add('player-no-double-white', data.player.exists && !data.player.bgColor.includes('255, 255, 255')
      ? pass(`player bg transparent: ${data.player.bgColor}`)
      : data.player.exists
        ? fail(`player has solid white bg: ${data.player.bgColor}`)
        : fail('no player'));
    add('player-strip-bg', data.player.exists && data.player.bgImage.includes('radio-player-strip')
      ? pass('uses strip PNG')
      : fail('strip PNG missing'));
    add('player-edge-left', data.player.exists && data.player.left <= 1
      ? pass('flush left')
      : fail(`left gap ${data.player.left}`));
    add('player-edge-right', data.player.exists && Math.abs(data.player.right - w) < 2
      ? pass('flush right')
      : fail(`right gap ${w - data.player.right}`));
    if (pageScrolls) {
      add('player-at-page-bottom-initial', data.player.exists && data.player.bottom > h - 2
        ? pass(`footer at page bottom below fold (${data.player.bottom.toFixed(0)}px)`)
        : fail(`footer should be below fold when page scrolls`));
    } else {
      add('player-edge-bottom', data.player.exists && Math.abs(data.player.bottom - h) < 2
        ? pass('flush bottom')
        : fail(`bottom gap ${h - data.player.bottom}`));
    }
    add('artist-panel', data.panels.artist ? pass('artist panel') : fail('missing artist'));
    add('no-queue', !data.panels.queue ? pass('no queue on radio') : fail('queue should not show'));
    add('no-sidebar', !data.panels.sidebarPanel ? pass('no sidebar on radio') : fail('sidebar visible'));
    add('intro-panel', data.panels.intro ? pass('intro bubble text') : fail('missing intro'));
    add('tabs-visible', data.tabs.radio ? pass(`active tab: ${data.tabs.radio}`) : fail('no active tab'));
  }

  if (cfg.checks === 'playlists') {
    add('no-player', !data.player.exists ? pass('no bottom player') : fail('player should not exist'));
    add('sidebar-bg', data.sidebar
      ? pass(`sidebar panel ${data.sidebar.width.toFixed(0)}px from top ${data.sidebar.top}`)
      : fail('sidebar panel missing'));
    const sidebarPanelEl = await page.evaluate(() => {
      const el = document.querySelector('.radio-panel--sidebar');
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { bgColor: cs.backgroundColor, z: cs.zIndex };
    });
    add('sidebar-opaque-white', sidebarPanelEl && sidebarPanelEl.bgColor.includes('255, 255, 255')
      ? pass(`solid white panel ${sidebarPanelEl.bgColor}`)
      : fail(`no solid white: ${sidebarPanelEl?.bgColor}`));
    add('sidebar-from-top', data.sidebar && data.sidebar.top <= 2
      ? pass('sidebar from top')
      : fail(`sidebar top ${data.sidebar?.top}`));
    add('sidebar-full-height', data.sidebar && data.wrap
      && Math.abs(data.sidebar.height - data.wrap.height) < 15
      ? pass(`sidebar height ${data.sidebar.height.toFixed(0)}px`)
      : fail(`sidebar height ${data.sidebar?.height} vs artboard ${data.wrap?.height}`));
    add('queue-panel', data.panels.queue ? pass('queue panel') : fail('missing queue'));
    add('sidebar-panel', data.panels.sidebarPanel ? pass('sidebar text panel') : fail('missing sidebar panel'));
    add('playlists-tab', data.tabs.radio === 'PLAYLISTS' ? pass('PLAYLISTS active') : fail('tab state wrong'));
    add('intro-panel', data.panels.intro ? pass('intro bubble text') : fail('missing intro'));
  }

  // Tab switch check (once per page at 1920 only, pass 1)
  if (vw === 1920 && vh === 1080 && passNum === 1 && cfg.checks === 'radio') {
    await page.click('.radio-tab:not(.is-active)');
    await page.waitForTimeout(400);
    const switched = await page.evaluate(() => ({
      url: location.search,
      hasPlayer: !!document.querySelector('.radio-player'),
      hasQueue: !!document.querySelector('.radio-panel--queue'),
      active: document.querySelector('.radio-tab.is-active')?.textContent?.trim(),
    }));
    add('tab-to-playlists', switched.url.includes('playlists') && !switched.hasPlayer && switched.hasQueue
      ? pass('switched to playlists view')
      : fail(`tab switch failed: ${JSON.stringify(switched)}`));
    await page.click('.radio-tab:first-of-type');
    await page.waitForTimeout(400);
  }

  // Scroll up / down check
  if (pageScrolls) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    const topScroll = await page.evaluate(() => ({
      scrollY: window.scrollY,
      playerBottom: document.querySelector('.radio-player')?.getBoundingClientRect().bottom ?? null,
    }));
    add('scroll-at-top', topScroll.scrollY === 0 ? pass('scroll top ok') : fail(`scrollY ${topScroll.scrollY}`));

    await page.evaluate((y) => window.scrollTo(0, y / 2), maxScroll);
    await page.waitForTimeout(150);
    const midScroll = await page.evaluate(() => window.scrollY);
    add('scroll-mid', midScroll > 0 ? pass(`scroll mid ${midScroll}`) : fail('could not scroll mid'));

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(200);
    const scrolled = await page.evaluate(() => {
      const pr = document.querySelector('.radio-player')?.getBoundingClientRect();
      const wr = document.querySelector('.radio-page-root-wrap')?.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        playerBottom: pr?.bottom ?? null,
        wrapBottom: wr?.bottom ?? null,
        viewportH: innerHeight,
      };
    });
    add('scroll-to-bottom', scrolled.wrapBottom && Math.abs(scrolled.wrapBottom - h) < 3
      ? pass('wrap bottom at viewport after scroll')
      : fail(`wrap bottom ${scrolled.wrapBottom} vs ${h}`));
    if (cfg.checks === 'radio' && scrolled.playerBottom != null) {
      add('player-at-page-bottom', Math.abs(scrolled.playerBottom - scrolled.wrapBottom) < 3
        ? pass('player at page bottom when scrolled')
        : fail('player not at page bottom'));
      add('player-flush-viewport-bottom', Math.abs(scrolled.playerBottom - h) < 3
        ? pass('player flush viewport when scrolled to end')
        : fail(`player bottom ${scrolled.playerBottom} vs ${h}`));
    }
  } else {
    add('scroll-at-top', pass('no scroll needed'));
    add('scroll-mid', pass('no scroll needed'));
    add('scroll-to-bottom', pass('no scroll needed'));
  }

  const shot = path.join(OUT, `audit_pass${passNum}_${cfg.name}_${vw}x${vh}.png`);
  await page.screenshot({ path: shot, fullPage: false });

  return results;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const allResults = [];
  const failures = [];

  for (let passNum = 1; passNum <= 2; passNum++) {
    console.log(`\n========== PASS ${passNum} ==========`);
    for (const vp of VIEWPORTS) {
      const [vw, vh] = vp;
      const context = await browser.newContext({ viewport: { width: vw, height: vh } });
      const page = await context.newPage();

      for (const cfg of PAGES) {
        const results = await auditPage(page, cfg, vw, vh, passNum);
        allResults.push(...results);
        for (const r of results) {
          const line = `[pass${passNum}] ${cfg.name} ${vw}x${vh} ${r.id}: ${r.ok ? 'OK' : 'FAIL'} — ${r.msg}`;
          console.log(line);
          if (!r.ok) failures.push(line);
        }
      }
      await context.close();
    }
  }

  await browser.close();

  console.log('\n========== SUMMARY ==========');
  console.log(`Total checks: ${allResults.length}`);
  console.log(`Failures: ${failures.length}`);
  if (failures.length) {
    console.log('\nFailed checks:');
    failures.forEach((f) => console.log('  ' + f));
    process.exit(1);
  }
  console.log('All checks passed on both passes.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
