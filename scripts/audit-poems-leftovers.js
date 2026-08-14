const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join('comparison-runs', 'poems-ai-vs-live-1440', 'audit');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/poems', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForSelector('.clp-page', { timeout: 60000 });
  await page.waitForTimeout(2500);

  const audit = {};

  audit.main = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const intro = q('.clp-intro');
    const poem = q('.clp-poem-text');
    const poet = q('.clp-poem-poet');
    const translator = q('.clp-translator');
    const prev = q('.clp-prevnext');
    const pageEl = q('.clp-page');
    const toolbar = q('.clp-toolbar');
    return {
      pageW: pageEl && Math.round(pageEl.getBoundingClientRect().width),
      toolbarW: toolbar && Math.round(toolbar.getBoundingClientRect().width),
      introFontStyle: intro && cs(intro).fontStyle,
      introSize: intro && cs(intro).fontSize,
      poemFontStyle: poem && cs(poem).fontStyle,
      poemSize: poem && cs(poem).fontSize,
      poetText: poet && poet.textContent.trim(),
      translatorText: translator && translator.textContent.trim(),
      prevColor: prev && cs(prev).color,
      prevText: prev && prev.textContent.trim(),
    };
  });

  await page.locator('.clp-related').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  audit.explore = await page.evaluate(() => {
    const row = document.querySelector('.clp-related .explore-titlerow');
    const title = row && row.querySelector('.explore-itemtitle');
    const sub = row && row.querySelector('.explore-itemsubtitle');
    const thumb = document.querySelector('.clp-related .explore-thumb');
    const desc = document.querySelector('.clp-related .explore-itemdesc');
    let sameLine = false;
    if (title && sub) {
      sameLine =
        Math.abs(title.getBoundingClientRect().top - sub.getBoundingClientRect().top) < 8;
    }
    const descText = (desc && desc.textContent) || '';
    return {
      sameLine,
      thumbRadius: thumb && getComputedStyle(thumb).borderRadius,
      hasLiteralBackslashN: descText.includes('\\n'),
      itemCount: document.querySelectorAll('.clp-related .explore-item').length,
      seeMore: !!document.querySelector('.clp-related .explore-seemore'),
    };
  });
  await page.screenshot({ path: path.join(OUT, 'explore.png') });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  await page.locator('.clp-see-all').click();
  await page.waitForSelector('.ajab-filter-drawer', { timeout: 10000 });
  await page.waitForTimeout(500);
  await page.locator('.ajab-filter-drawer button').filter({ hasText: /^Poets$/ }).click();
  await page.waitForTimeout(400);
  const items = page.locator('.ajab-filter-list li');
  const n = Math.min(2, await items.count());
  for (let i = 0; i < n; i++) {
    await items.nth(i).click();
    await page.waitForTimeout(250);
  }
  audit.filter = await page.evaluate(() => {
    const drawer = document.querySelector('.ajab-filter-drawer');
    const poets = [...document.querySelectorAll('.ajab-filter-drawer button')].find((b) =>
      /^Poets$/i.test((b.textContent || '').trim())
    );
    const chips = [...document.querySelectorAll('.ajab-filter-selections button')].map((b) =>
      b.textContent.trim()
    );
    return {
      drawerW: drawer && Math.round(drawer.getBoundingClientRect().width),
      poetsColor: poets && getComputedStyle(poets).color,
      chipCount: chips.length,
      chips,
    };
  });
  await page.screenshot({ path: path.join(OUT, 'filter.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  await page.locator('.clp-actions button', { hasText: 'NOTES' }).click();
  await page.waitForTimeout(700);
  audit.notes = await page.evaluate(() => {
    const pop =
      document.querySelector('.clp-notes-popup') || document.querySelector('.wp-popup--anchored');
    const seeAll = document.querySelector('.clp-see-all');
    const r = pop.getBoundingClientRect();
    const sr = seeAll.getBoundingClientRect();
    const overlap = !(
      r.right < sr.left ||
      r.left > sr.right ||
      r.bottom < sr.top ||
      r.top > sr.bottom
    );
    const body = (pop.textContent || '').replace(/\s+/g, ' ');
    return {
      left: Math.round(r.left),
      top: Math.round(r.top),
      overlapSeeAll: overlap,
      placeholder: /will appear here|Archive notes/i.test(body),
      sample: body.slice(0, 100),
    };
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await page.locator('.clp-actions button', { hasText: 'GLOSSARY' }).click();
  await page.waitForTimeout(700);
  audit.glossary = await page.evaluate(() => {
    const pop =
      document.querySelector('.clp-glossary-popup') ||
      document.querySelector('.wp-popup--anchored');
    const r = pop && pop.getBoundingClientRect();
    return {
      open: !!pop,
      left: r && Math.round(r.left),
      w: r && Math.round(r.width),
      sample: ((pop && pop.textContent) || '').replace(/\s+/g, ' ').slice(0, 120),
    };
  });
  await page.screenshot({ path: path.join(OUT, 'glossary.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  await page.locator('.clp-actions button', { hasText: 'LISTEN' }).click();
  await page.waitForTimeout(900);
  audit.listen = await page.evaluate(() => {
    const pop = document.querySelector('.clp-player-popup');
    const r = pop && pop.getBoundingClientRect();
    const singers = [...(pop ? pop.querySelectorAll('li') : [])].map((li) =>
      (li.textContent || '').trim().split('\n')[0].trim()
    );
    const unique = new Set(singers.map((s) => s.toLowerCase()));
    const iframe = pop && pop.querySelector('iframe');
    return {
      top: r && Math.round(r.top),
      right: r && Math.round(r.right),
      singers,
      uniqueCount: unique.size,
      progress: !!(pop && pop.querySelector('.clp-player-progress')),
      hasPlayControls: !!(pop && pop.querySelector('.clp-player-play')),
      iframeVisible: iframe
        ? iframe.offsetWidth > 2 && getComputedStyle(iframe).opacity !== '0'
        : false,
    };
  });
  await page.screenshot({ path: path.join(OUT, 'listen.png') });

  audit.fabs = await page.evaluate(() => ({
    shareOrTop: document.querySelectorAll(
      'button[aria-label*="Share" i], button[aria-label*="Top" i], .floating-actions button'
    ).length,
  }));

  console.log(JSON.stringify(audit, null, 2));
  fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(audit, null, 2));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
