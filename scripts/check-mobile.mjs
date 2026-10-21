import { chromium } from 'playwright';
const pages = ['/', '/price/', '/catalog/', '/catalog/beton/', '/catalog/beton/tovarnyj/', '/catalog/beton/tovarnyj/beton-m300-granit/',
  '/beton/m300/', '/beton/dlya-fundament/', '/o-zavode/', '/kontakty/', '/korzina/', '/poisk/?q=М300', '/404.html'];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(`JS: ${e.message}`));
for (const path of pages) {
  const res = await p.goto('http://localhost:4321' + path, { waitUntil: 'networkidle' });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (res.status() !== 200 && path !== '/404.html') errors.push(`${path}: status ${res.status()}`);
  if (overflow > 0) errors.push(`${path}: горизонтальный скролл на 375px, +${overflow}px`);
}
console.log(errors.length ? errors.join('\n') : 'Мобильная проверка пройдена, скролла нет, ошибок JS нет');
await browser.close();
