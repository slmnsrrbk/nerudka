// Проверка главной: горизонтальный скролл на разных ширинах, ошибки JS, 404.
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:4321/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let bad = 0;
for (const [w, h, mobile] of [[320, 640, true], [375, 812, true], [390, 844, true], [430, 932, true], [768, 1024, true], [1024, 768, false], [1280, 800, false], [1440, 900, false], [1920, 1080, false], [2560, 1440, false]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) errs.push(`${r.status()} ${r.url()}`); });
  await p.goto(base, { waitUntil: 'load' });
  const res = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const clipped = (e) => { for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.overflowX !== 'visible' || s.position === 'fixed') return true; } return false; };
    const over = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed' && !clipped(e); })
      .slice(0, 6).map((e) => `${e.tagName}.${String(e.className).slice(0, 30)} [${Math.round(e.getBoundingClientRect().left)}..${Math.round(e.getBoundingClientRect().right)}]`);
    return { sw: document.documentElement.scrollWidth, vw, over };
  });
  const ok = res.sw <= res.vw && !res.over.length && !errs.length;
  if (!ok) bad++;
  console.log(`${ok ? 'OK ' : 'BAD'} ${w}x${h} scrollWidth=${res.sw} vw=${res.vw}`, res.over.length ? res.over : '', errs.length ? errs : '');
  await p.close();
}
await b.close();
process.exit(bad ? 1 : 0);
