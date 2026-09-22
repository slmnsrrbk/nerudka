import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const url of ['/catalog/', '/_prototype/']) {
  const p = await b.newPage({ viewport: { width: 375, height: 900 } });
  await p.goto('http://localhost:4321' + url, { waitUntil: 'networkidle' });
  const out = await p.evaluate(() => {
    const inScroller = (el) => { let n = el.parentElement; while (n && n !== document.body) { if (getComputedStyle(n).overflowX !== 'visible') return true; n = n.parentElement; } return false; };
    const res = [];
    document.body.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > 376 && !inScroller(el) && r.width > 40) {
        res.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 70), right: Math.round(r.right), w: Math.round(r.width), text: (el.textContent || '').trim().slice(0, 40) });
      }
    });
    return res.slice(0, 6);
  });
  console.log(url, JSON.stringify(out, null, 1));
  await p.close();
}
await b.close();
