import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:3000/poems', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const listing = await page.evaluate(() => ({
  count: document.querySelector('.clp-count')?.textContent?.trim(),
  poemLink: document.querySelector('.clp-poem-center a[href^="/poems/"]')?.getAttribute('href'),
  seeAllHasClick: document.querySelector('.clp-seeall')?.onclick !== null,
  seeAllType: document.querySelector('.clp-seeall')?.tagName,
  glossaryStrip: !!document.querySelector('[class*="glossary"], .glossary-strip'),
  notesAlwaysShown: !!document.querySelector('.clp-notes-glossary'),
}));

console.log('Listing:', JSON.stringify(listing, null, 2));

const id = listing.poemLink?.replace('/poems/', '') || '1';
for (const path of [`/poems/${id}`, '/poems/1', '/poems/p1']) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const d = await page.evaluate(() => ({
    path: location.pathname,
    notFound: document.body.textContent?.includes('Poem not found'),
    hasDetail: !!document.querySelector('.clp-page--detail'),
    hasHalo: !!document.querySelector('.clp-halo-circle'),
    title: document.querySelector('.clp-count')?.textContent?.trim().slice(0, 50),
  }));
  console.log('Detail', path, JSON.stringify(d));
}

await browser.close();
