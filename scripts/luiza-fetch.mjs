// Забирает тексты и фото кейса с luizaevent.ru для прототипа страницы кейса.
// Запускается на раннере GitHub Actions: из контейнера разработки домены
// luizaevent.ru и tildacdn закрыты сетевой политикой (прокси отдаёт 403 на CONNECT).
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const URL = process.env.CASE_URL || 'https://luizaevent.ru/ilya_and_elizabeth';
const OUT = 'luiza/source';

await mkdir(`${OUT}/orig`, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });

// Ленивые картинки Тильды подгружаются при прокрутке, но оригинал всё равно
// лежит в data-original, прокрутка нужна только для скриншота.
for (let y = 0; y < 40000; y += 800) {
  await page.evaluate((v) => window.scrollTo(0, v), y);
  await page.waitForTimeout(120);
}
await page.screenshot({ path: `${OUT}/original-full.jpg`, fullPage: true, type: 'jpeg', quality: 60 });

// Записи страницы по порядку: для каждой тексты и картинки с размерами на экране.
const records = await page.evaluate(() => {
  const clean = (u) => (u || '').split('?')[0];
  const pick = (el) => {
    const raw = el.getAttribute('data-original') || el.getAttribute('data-content-cover-bg') ||
      el.getAttribute('src') || (getComputedStyle(el).backgroundImage.match(/url\("?(.*?)"?\)/) || [])[1];
    return raw && /tildacdn|tildaphoto/.test(raw) ? clean(raw) : null;
  };
  return [...document.querySelectorAll('#allrecords .r')].map((r) => {
    const imgs = [];
    const seen = new Set();
    for (const el of r.querySelectorAll('[data-original], img, .t-bgimg, .tn-atom, [style*="background-image"]')) {
      const u = pick(el);
      if (!u || seen.has(u) || /\.svg$/i.test(u)) continue;
      seen.add(u);
      const b = el.getBoundingClientRect();
      imgs.push({ url: u, w: Math.round(b.width), h: Math.round(b.height) });
    }
    const texts = [...r.querySelectorAll('.tn-atom, .t-title, .t-descr, .t-text, .t-name, h1, h2, h3, p')]
      .filter((el) => !el.querySelector('.tn-atom, p'))
      .map((el) => el.innerText.trim())
      .filter(Boolean);
    return { id: r.id, type: r.getAttribute('data-record-type'), texts: [...new Set(texts)], imgs };
  });
});

const all = [];
for (const r of records) for (const i of r.imgs) if (!all.find((a) => a.url === i.url)) all.push(i);

let n = 0;
for (const img of all) {
  n += 1;
  const ext = (img.url.match(/\.(jpe?g|png|webp)$/i) || ['', 'jpg'])[1].toLowerCase();
  img.file = `${String(n).padStart(2, '0')}.${ext}`;
  try {
    const res = await fetch(img.url);
    if (!res.ok) throw new Error(res.status);
    await writeFile(`${OUT}/orig/${img.file}`, Buffer.from(await res.arrayBuffer()));
  } catch (e) {
    img.error = String(e);
  }
}
for (const r of records) for (const i of r.imgs) i.file = all.find((a) => a.url === i.url).file;

await writeFile(`${OUT}/source.json`, JSON.stringify({ url: URL, title: await page.title(), records }, null, 2));
console.log(`Записей: ${records.length}, фото: ${all.length}`);
await browser.close();
