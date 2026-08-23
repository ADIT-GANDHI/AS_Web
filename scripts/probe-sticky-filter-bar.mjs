import { chromium } from 'playwright';

const URLS = [
  { name: 'people', url: 'http://localhost:3000/people' },
  { name: 'songs', url: 'http://localhost:3000/songs' },
  { name: 'reflections', url: 'http://localhost:3000/reflections' },
  { name: 'glossary', url: 'http://localhost:3000/glossary' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const { name, url } of URLS) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('.cl-filter-bar', { timeout: 120000 });
  await page.waitForTimeout(500);

  const before = await page.evaluate(() => {
    function ancestorChain(el) {
      const chain = [];
      let node = el;
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);
        chain.push({
          tag: node.tagName?.toLowerCase(),
          class: node.className?.toString?.().slice(0, 80) || '',
          overflow: cs.overflow,
          overflowX: cs.overflowX,
          overflowY: cs.overflowY,
          transform: cs.transform,
          position: cs.position,
        });
        node = node.parentElement;
      }
      return chain;
    }

    const bar = document.querySelector('.cl-filter-bar');
    const r = bar?.getBoundingClientRect();
    const cs = bar ? getComputedStyle(bar) : null;
    return {
      top: r ? Math.round(r.top) : null,
      position: cs?.position ?? null,
      topCss: cs?.top ?? null,
      scrollY: window.scrollY,
      headerBottom: document.querySelector('header')?.getBoundingClientRect().bottom ?? null,
      ancestors: bar ? ancestorChain(bar) : [],
    };
  });

  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);

  const after = await page.evaluate(() => {
    const bar = document.querySelector('.cl-filter-bar');
    const r = bar?.getBoundingClientRect();
    const cs = bar ? getComputedStyle(bar) : null;
    return {
      top: r ? Math.round(r.top) : null,
      position: cs?.position ?? null,
      pinnedClass: bar?.classList.contains('cl-filter-bar--pinned') ?? false,
      scrollY: window.scrollY,
      headerBottom: document.querySelector('header')?.getBoundingClientRect().bottom ?? null,
    };
  });

  const pinWorking =
    after.pinnedClass &&
    after.top != null &&
    after.scrollY > 100 &&
    after.top >= -2 &&
    after.top <= 4;

  console.log(JSON.stringify({ page: name, before, after, pinWorking }, null, 2));
}

await browser.close();
