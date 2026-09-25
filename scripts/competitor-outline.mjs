// Выгружает структуру главной страницы конкурента: блоки сверху вниз,
// заголовки и видимый текст каждого блока, плюс снимки страницы кусками.
// Запускается на раннере GitHub: из контейнера разработки эти домены закрыты.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const SITES = [
  { slug: 'gmr-beton', url: 'https://gmr-beton.ru/' },
  { slug: 'mosavtobeton', url: 'https://mosavtobeton.ru/' },
];
const OUT = 'competitors/outline';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const site of SITES) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'ru-RU',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(10000);
    // прокрутка, чтобы подгрузились ленивые блоки
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(2000);
    const outline = await page.evaluate(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.height > 40 && r.width > 300 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
      // кандидаты в блоки: крупные элементы, у которых есть заголовок h1-h3
      const blocks = [];
      const seen = new Set();
      for (const h of document.querySelectorAll('h1, h2, h3, .title, [class*="title"]')) {
        if (!vis(h)) continue;
        let b = h;
        while (b.parentElement && b.parentElement !== document.body && b.parentElement.getBoundingClientRect().height < 1600) b = b.parentElement;
        if (seen.has(b)) continue;
        seen.add(b);
        const r = b.getBoundingClientRect();
        const text = (b.innerText || '').replace(/\n{2,}/g, '\n').trim();
        if (text.length < 20) continue;
        blocks.push({ top: Math.round(r.top + window.scrollY), height: Math.round(r.height), tag: b.tagName.toLowerCase(), cls: (b.className || '').toString().slice(0, 80), headings: [...b.querySelectorAll('h1,h2,h3')].map((x) => x.innerText.trim()).filter(Boolean).slice(0, 8), text: text.slice(0, 2500) });
      }
      blocks.sort((a, b) => a.top - b.top);
      // убираем вложенные дубли
      const res = [];
      for (const b of blocks) { const last = res[res.length - 1]; if (last && b.top >= last.top && b.top + b.height <= last.top + last.height && last.text.includes(b.text.slice(0, 60))) continue; res.push(b); }
      const nav = [...document.querySelectorAll('header a, nav a')].map((a) => a.innerText.trim()).filter((s) => s && s.length < 40);
      const footer = (document.querySelector('footer')?.innerText || '').slice(0, 3000);
      return { title: document.title, height: document.documentElement.scrollHeight, nav: [...new Set(nav)].slice(0, 80), blocks: res, footer };
    });
    await writeFile(`${OUT}/${site.slug}.json`, JSON.stringify(outline, null, 2) + '\n');
    // снимки кусками по 3000 px по всей высоте
    const H = outline.height, CH = 3000;
    for (let i = 0, y = 0; y < H && i < 10; i++, y += CH) {
      const h = Math.min(CH, H - y);
      await page.setViewportSize({ width: 1440, height: h });
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `${OUT}/${site.slug}-${String(i + 1).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 70 });
    }
    console.log(`ok ${site.slug}: ${outline.blocks.length} блоков, высота ${outline.height}`);
  } catch (e) {
    console.log(`FAIL ${site.slug}: ${String(e.message || e).split('\n')[0]}`);
  } finally { await ctx.close(); }
}
await browser.close();
