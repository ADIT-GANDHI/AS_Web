import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/poems', {
  waitUntil: 'networkidle',
  timeout: 90000,
});
await page.waitForTimeout(1200);
await page.locator('button:has-text("See All")').first().click();
await page.waitForTimeout(800);

const data = await page.locator('.ajab-filter-drawer').evaluate((el) => {
  const rect = el.getBoundingClientRect();
  const items = Array.from(
    el.querySelectorAll('.ajab-filter-list li')
  ).slice(0, 12);
  const rows = items.map((li) => {
    const spans = Array.from(li.querySelectorAll('span'));
    const label = spans[0];
    const sub = spans[1];
    const lr = label?.getBoundingClientRect();
    const style = label ? getComputedStyle(label.parentElement) : null;
    return {
      text: (label?.textContent || '').trim(),
      sub: (sub?.textContent || '').trim(),
      labelRight: lr ? Math.round(lr.right) : null,
      drawerRight: Math.round(rect.right),
      bleeds: lr ? lr.right > rect.right - 4 : false,
      lines: label
        ? Math.round(lr.height / parseFloat(getComputedStyle(label).lineHeight || '22'))
        : 0,
      wordBreak: style?.wordBreak,
      overflowWrap: style?.overflowWrap,
    };
  });

  // Detect mid-word line breaks via Range API on first multi-line label
  const midWordBreaks = [];
  for (const li of items) {
    const label = li.querySelector('span');
    if (!label || !label.firstChild) continue;
    const text = label.textContent || '';
    if (text.length < 8) continue;
    const range = document.createRange();
    const node = label.firstChild;
    let prevBottom = null;
    for (let i = 0; i < text.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const r = range.getBoundingClientRect();
      if (prevBottom != null && r.top > prevBottom + 2) {
        // line break before char i — check if previous char was not space
        const prev = text[i - 1];
        const cur = text[i];
        if (prev && cur && !/\s/.test(prev) && !/\s/.test(cur)) {
          midWordBreaks.push({
            text: text.slice(Math.max(0, i - 8), i + 8),
            at: i,
          });
        }
      }
      prevBottom = r.bottom;
    }
  }

  const close = Array.from(el.querySelectorAll('button')).find(
    (b) => (b.getAttribute('aria-label') || '') === 'Close filters'
  );
  const cr = close.getBoundingClientRect();
  const header = Array.from(el.querySelectorAll('button, span'))
    .map((n) => {
      const r = n.getBoundingClientRect();
      return {
        t: (n.textContent || '').trim(),
        right: Math.round(r.right),
        top: Math.round(r.top),
        h: Math.round(r.height),
      };
    })
    .filter(
      (n) =>
        n.h > 0 &&
        n.h < 40 &&
        n.top >= rect.top &&
        n.top < rect.top + 260 &&
        /^(Filter by|Poets|Themes|\|)$/.test(n.t)
    );
  const rightmost = [...header]
    .filter((n) => n.t === 'Themes' || n.t === 'Poets')
    .sort((a, b) => b.right - a.right)[0];

  return {
    width: Math.round(rect.width),
    gapToClose: rightmost ? Math.round(cr.left - rightmost.right) : null,
    header: header.map((h) => h.t),
    anyBleed: rows.some((r) => r.bleeds),
    midWordBreaks: midWordBreaks.slice(0, 5),
    sample: rows.slice(0, 5),
  };
});

await page.screenshot({
  path: 'comparison-runs/filter-drawer-1440/poems-380.png',
  clip: { x: 0, y: 0, width: 520, height: 480 },
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
process.exit(data.anyBleed || data.midWordBreaks.length || data.width !== 380 ? 1 : 0);
