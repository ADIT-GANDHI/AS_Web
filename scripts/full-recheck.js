/**
 * Full re-check: Poems side panels + Listen API player + Radio footer.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join('comparison-runs', 'full-recheck');
fs.mkdirSync(OUT, { recursive: true });

function assert(cond, msg, fails, passes) {
  if (cond) passes.push(msg);
  else fails.push(msg);
}

(async () => {
  const fails = [];
  const passes = [];
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));

  // ─── POEMS ─────────────────────────────────────────────
  await page.goto('http://localhost:3000/poems', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForSelector('.clp-page', { timeout: 60000 });
  await page.waitForTimeout(2800);

  assert(await page.locator('.clp-page').count(), 'Poems page mounted', fails, passes);
  assert(await page.locator('.clp-side-slot').count(), 'Shared side slot exists', fails, passes);

  // LISTEN
  await page.locator('.clp-actions button', { hasText: 'LISTEN' }).click({ force: true });
  await page.waitForTimeout(1200);
  let m = await page.evaluate(() => {
    const slot = document.querySelector('.clp-side-slot');
    const stage = document.querySelector('.clp-poem-stage');
    const pop = document.querySelector('.clp-player-popup');
    const poem = document.querySelector('.clp-poem-text');
    const sr = slot?.getBoundingClientRect();
    const st = stage?.getBoundingClientRect();
    const pr = pop?.getBoundingClientRect();
    const lr = poem?.getBoundingClientRect();
    const clips = [...document.querySelectorAll('.clp-player-clip-name')].map((el) =>
      el.textContent.trim()
    );
    const unique = new Set(clips.map((c) => c.toLowerCase()));
    const overlap =
      pr && lr
        ? !(pr.right < lr.left || pr.left > lr.right || pr.bottom < lr.top || pr.top > lr.bottom)
        : true;
    return {
      popOpen: !!pop,
      slot:
        sr && st
          ? {
              W: Math.round(sr.width),
              relL: Math.round(sr.left - st.left),
              relT: Math.round(sr.top - st.top),
              right: Math.round(sr.right),
            }
          : null,
      gap: pr && lr ? Math.round(pr.left - lr.right) : null,
      overlap,
      clips,
      unique: unique.size,
      iframe: !!document.querySelector('.clp-soundcloud-widget'),
      endTime: [...document.querySelectorAll('.clp-player-time')].map((t) => t.textContent),
      vw: window.innerWidth,
    };
  });
  assert(m.popOpen, 'Listen panel opens', fails, passes);
  assert(m.slot?.W === 280, `Side slot width 280 (got ${m.slot?.W})`, fails, passes);
  assert(m.slot?.right <= m.vw + 1, `Side slot fits viewport (right=${m.slot?.right} vw=${m.vw})`, fails, passes);
  assert(!m.overlap, `Listen does not cover lyrics (gap=${m.gap})`, fails, passes);
  assert(m.gap != null && m.gap > 40, `Listen outside lyrics gap>40 (got ${m.gap})`, fails, passes);
  assert(m.clips.length >= 3, `API clips loaded (${m.clips.length})`, fails, passes);
  assert(m.unique === m.clips.length, `Unique singers (${m.unique}/${m.clips.length})`, fails, passes);
  assert(m.iframe, 'SoundCloud iframe present', fails, passes);
  await page.screenshot({ path: path.join(OUT, '01-listen.png') });
  const listenSlot = m.slot;

  // Switch track
  const clipCount = await page.locator('.clp-player-clip').count();
  if (clipCount > 1) {
    const first = await page.locator('.clp-player-clip.is-active .clp-player-clip-name').textContent();
    await page.locator('.clp-player-clip').nth(1).click({ force: true });
    await page.waitForTimeout(700);
    const second = await page.locator('.clp-player-clip.is-active .clp-player-clip-name').textContent();
    assert(second && second !== first, `Track switch works (${first} → ${second})`, fails, passes);
  } else {
    fails.push('Not enough clips to test track switch');
  }

  // Play + duration
  await page.locator('.clp-player-play').click({ force: true });
  await page.waitForTimeout(2000);
  const playMeta = await page.evaluate(() => {
    const times = [...document.querySelectorAll('.clp-player-timeline .clp-player-time')].map(
      (el) => el.textContent
    );
    return {
      times,
      volBtn: !!document.querySelector('button[aria-label="Volume"]'),
    };
  });
  const end = playMeta.times[1] || '';
  assert(end !== '1:30' && end !== '0:00', `Real duration shown (${end})`, fails, passes);

  await page.locator('button[aria-label="Volume"]').evaluate((el) => el.click());
  await page.waitForTimeout(200);
  assert(
    (await page.locator('.clp-player-volume-slider').count()) === 1,
    'Volume slider opens',
    fails,
    passes
  );

  // NOTES — same slot, exclusive
  await page.locator('.clp-actions button', { hasText: 'NOTES' }).click({ force: true });
  await page.waitForTimeout(700);
  m = await page.evaluate(() => {
    const notes = document.querySelector('.clp-side-sheet.clp-notes-popup, .clp-notes-popup');
    const listen = document.querySelector('.clp-player-popup');
    const slot = document.querySelector('.clp-side-slot');
    const stage = document.querySelector('.clp-poem-stage');
    const r = slot?.getBoundingClientRect();
    const st = stage?.getBoundingClientRect();
    return {
      notesOpen: !!notes && getComputedStyle(notes).display !== 'none',
      listenGone: !listen,
      slot:
        r && st
          ? {
              W: Math.round(r.width),
              relL: Math.round(r.left - st.left),
              relT: Math.round(r.top - st.top),
            }
          : null,
      text: (notes?.textContent || '').slice(0, 60),
    };
  });
  assert(m.notesOpen, 'Notes opens', fails, passes);
  assert(m.listenGone, 'Listen closes when Notes opens', fails, passes);
  assert(
    m.slot?.relL === listenSlot.relL &&
      m.slot?.relT === listenSlot.relT &&
      m.slot?.W === listenSlot.W,
    `Notes same slot as Listen (notes=${JSON.stringify(m.slot)} listen=${JSON.stringify(listenSlot)})`,
    fails,
    passes
  );
  await page.screenshot({ path: path.join(OUT, '02-notes.png') });

  // GLOSSARY — same slot, exclusive
  await page.locator('.clp-actions button', { hasText: 'GLOSSARY' }).click({ force: true });
  await page.waitForTimeout(700);
  m = await page.evaluate(() => {
    const gloss = document.querySelector('.clp-side-sheet');
    const notesTitle = document.querySelector('.wp-popup-title')?.textContent?.trim();
    const listen = document.querySelector('.clp-player-popup');
    const slot = document.querySelector('.clp-side-slot');
    const stage = document.querySelector('.clp-poem-stage');
    const r = slot?.getBoundingClientRect();
    const st = stage?.getBoundingClientRect();
    return {
      glossOpen: !!gloss,
      title: notesTitle,
      listenGone: !listen,
      slot:
        r && st
          ? {
              W: Math.round(r.width),
              relL: Math.round(r.left - st.left),
              relT: Math.round(r.top - st.top),
            }
          : null,
    };
  });
  assert(m.glossOpen, 'Glossary opens', fails, passes);
  assert(/glossary/i.test(m.title || ''), `Glossary title (${m.title})`, fails, passes);
  assert(m.listenGone, 'Listen closed while Glossary open', fails, passes);
  assert(
    m.slot?.relL === listenSlot.relL &&
      m.slot?.relT === listenSlot.relT &&
      m.slot?.W === listenSlot.W,
    `Glossary same slot as Listen (gloss=${JSON.stringify(m.slot)} listen=${JSON.stringify(listenSlot)})`,
    fails,
    passes
  );
  await page.screenshot({ path: path.join(OUT, '03-glossary.png') });

  // Only one active tab underline
  const activeCount = await page.locator('.clp-actions button.is-active').count();
  assert(activeCount === 1, `Exactly one action active (got ${activeCount})`, fails, passes);

  // Close (wait for AnimatePresence exit to unmount)
  await page.locator('.clp-poem-stage').click({ position: { x: 8, y: 8 } });
  await page.keyboard.press('Escape');
  await page.waitForFunction(
    () => !document.querySelector('.clp-player-popup, .clp-side-sheet'),
    { timeout: 2500 }
  ).catch(() => null);
  const closed = await page.evaluate(
    () => !document.querySelector('.clp-player-popup, .clp-side-sheet')
  );
  assert(closed, 'Escape closes side panel', fails, passes);

  // Explore leftovers
  await page.locator('.clp-related').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const explore = await page.evaluate(() => {
    const row = document.querySelector('.clp-related .explore-titlerow');
    const title = row?.querySelector('.explore-itemtitle');
    const sub = row?.querySelector('.explore-itemsubtitle');
    const thumb = document.querySelector('.clp-related .explore-thumb');
    const desc = document.querySelector('.clp-related .explore-itemdesc');
    let sameLine = false;
    if (title && sub) {
      sameLine =
        Math.abs(title.getBoundingClientRect().top - sub.getBoundingClientRect().top) < 8;
    }
    return {
      sameLine,
      radius: thumb && getComputedStyle(thumb).borderRadius,
      literalNn: desc ? desc.textContent.includes('\\n') : null,
    };
  });
  assert(explore.sameLine, 'Explore title+subtitle same line', fails, passes);
  assert(explore.radius && explore.radius !== '0px', `Explore rounded thumbs (${explore.radius})`, fails, passes);
  assert(!explore.literalNn, 'Explore no literal \\n', fails, passes);
  await page.screenshot({ path: path.join(OUT, '04-explore.png') });

  // ─── RADIO ─────────────────────────────────────────────
  await page.goto('http://localhost:3000/radio', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForTimeout(2000);
  const radio = await page.evaluate(() => {
    const footer = document.querySelector('footer.footer-bg');
    return {
      footerDisplay: footer ? getComputedStyle(footer).display : 'missing',
      hasPlayer: !!document.querySelector('.radio-player'),
      scrollH: document.documentElement.scrollHeight,
      vh: innerHeight,
      transport: !!document.querySelector('.radio-transport'),
    };
  });
  assert(radio.footerDisplay === 'none', 'Radio footer hidden', fails, passes);
  assert(radio.hasPlayer, 'Radio bottom player present', fails, passes);
  assert(radio.transport, 'Radio transport controls present', fails, passes);
  assert(radio.scrollH <= radio.vh + 5, `Radio no footer scroll (${radio.scrollH}/${radio.vh})`, fails, passes);
  await page.screenshot({ path: path.join(OUT, '05-radio.png') });

  await page.goto('http://localhost:3000/radio?view=playlists', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForTimeout(1500);
  const pl = await page.evaluate(() => {
    const footer = document.querySelector('footer.footer-bg');
    const artists = [...document.querySelectorAll('.radio-playlist-artist')]
      .slice(0, 4)
      .map((el) => el.textContent.trim());
    const uniqueArtists = new Set(artists);
    return {
      footerDisplay: footer ? getComputedStyle(footer).display : 'missing',
      playlistCount: document.querySelectorAll('.radio-playlist-item').length,
      queueCount: document.querySelectorAll('.radio-queue-item').length,
      artists,
      uniqueArtists: uniqueArtists.size,
      tab: document.querySelector('.radio-tab.is-active')?.textContent?.trim(),
    };
  });
  assert(pl.footerDisplay === 'none', 'Playlists footer hidden', fails, passes);
  assert(pl.playlistCount >= 10, `Playlists listed (${pl.playlistCount})`, fails, passes);
  assert(pl.queueCount >= 1, `Queue has tracks (${pl.queueCount})`, fails, passes);
  assert(pl.tab === 'PLAYLISTS', 'PLAYLISTS tab active', fails, passes);
  assert(pl.uniqueArtists > 1, `Playlist artists vary (${pl.uniqueArtists})`, fails, passes);
  await page.screenshot({ path: path.join(OUT, '06-playlists.png') });

  console.log('\n=== PASSES ===');
  passes.forEach((p) => console.log('  ✓', p));
  console.log('\n=== FAILS ===');
  if (!fails.length) console.log('  (none)');
  else fails.forEach((f) => console.log('  ✗', f));
  console.log('\npage errors:', errors.slice(0, 8));
  console.log(`\n${passes.length} passed, ${fails.length} failed`);

  fs.writeFileSync(
    path.join(OUT, 'report.json'),
    JSON.stringify({ passes, fails, errors: errors.slice(0, 20) }, null, 2)
  );

  await b.close();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
