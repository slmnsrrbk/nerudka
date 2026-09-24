// Ищет референсы на Pinterest и собирает контактные листы с номерами.
// Запускается на раннере GitHub: из контейнера разработки Pinterest закрыт.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = 'references/pinterest';
const PER_QUERY = Number(process.env.PER_QUERY || 12);
const QUERIES = (process.env.QUERIES || [
  'concrete plant website design',
  'industrial website design',
  'construction company website hero',
  'manufacturing company website ui',
  'building materials website design',
  'heavy industry web design dark',
  'b2b industrial landing page',
  'editorial website design industrial',
].join('|')).split('|').map((s) => s.trim()).filter(Boolean);

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1800 },
  locale: 'en-US',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
});
const page = await ctx.newPage();
const pins = [];
const seen = new Set();

for (const q of QUERIES) {
  const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}`;
  let got = 0;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);
    for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 1400); await page.waitForTimeout(1500); }
    const found = await page.evaluate(() => {
      const res = [];
      for (const a of document.querySelectorAll('a[href*="/pin/"]')) {
        const img = a.querySelector('img[src*="i.pinimg.com"]');
        if (!img) continue;
        const src = img.currentSrc || img.src;
        res.push({ pin: new URL(a.getAttribute('href'), location.origin).href.split('?')[0], img: src, alt: img.alt || '' });
      }
      return res;
    });
    for (const f of found) {
      if (got >= PER_QUERY) break;
      const key = f.img.replace(/\/\d+x\//, '/');
      if (seen.has(key)) continue;
      seen.add(key);
      const big = f.img.replace(/\/(\d+x|originals)\//, '/474x/');
      pins.push({ n: pins.length + 1, query: q, pin: f.pin, img: big, alt: f.alt });
      got++;
    }
    console.log(`ok   ${q}: ${got}`);
  } catch (e) {
    console.log(`FAIL ${q}: ${String(e.message || e).split('\n')[0]}`);
  }
}

// скачиваем превью, чтобы листы не зависели от сети при рендере
for (const p of pins) {
  try {
    const r = await ctx.request.get(p.img, { timeout: 30000 });
    if (r.ok()) {
      const file = `${OUT}/${String(p.n).padStart(3, '0')}.jpg`;
      await writeFile(file, await r.body());
      p.file = file;
    }
  } catch {}
}
await writeFile(`${OUT}/pins.json`, JSON.stringify(pins, null, 2) + '\n');

// контактные листы: по 24 пина, номер крупно в углу
const SHEET = 24;
const withFile = pins.filter((p) => p.file);
for (let s = 0; s * SHEET < withFile.length; s++) {
  const chunk = withFile.slice(s * SHEET, (s + 1) * SHEET);
  const { readFile } = await import('node:fs/promises');
  const tiles = await Promise.all(chunk.map(async (p) => {
    const b64 = (await readFile(p.file)).toString('base64');
    return `<figure><img src="data:image/jpeg;base64,${b64}"><b>${p.n}</b><figcaption>${p.query}</figcaption></figure>`;
  }));
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:24px;background:#111;font:14px system-ui;color:#fff}
    .g{columns:6;column-gap:14px}
    figure{break-inside:avoid;margin:0 0 14px;position:relative;background:#222;border-radius:10px;overflow:hidden}
    img{display:block;width:100%}
    b{position:absolute;left:8px;top:8px;background:#FF5A1F;color:#111;font-size:22px;font-weight:800;padding:4px 10px;border-radius:8px}
    figcaption{padding:6px 8px;font-size:11px;color:#aaa}
  </style><div class="g">${tiles.join('')}</div>`;
  const sp = await ctx.newPage();
  await sp.setViewportSize({ width: 1600, height: 1000 });
  await sp.setContent(html, { waitUntil: 'load' });
  await sp.waitForTimeout(800);
  await sp.screenshot({ path: `${OUT}/sheet-${s + 1}.jpg`, type: 'jpeg', quality: 80, fullPage: true });
  await sp.close();
}
await browser.close();
console.log(`Пинов: ${pins.length}, с картинкой: ${withFile.length}`);
