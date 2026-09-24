// Снимает первые экраны и полные страницы сайтов-конкурентов.
// Запускается на раннере GitHub Actions: из контейнера разработки эти домены
// закрыты сетевой политикой (прокси отдаёт 403 на CONNECT).
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const SITES = [
  { slug: '01-gmr-beton', url: 'https://gmr-beton.ru/' },
  { slug: '02-mosavtobeton', url: 'https://mosavtobeton.ru/' },
  { slug: '03-ksg-beton', url: 'https://ksg-beton.ru/' },
  { slug: '04-moscow-beton', url: 'https://moscow-beton.ru/' },
  { slug: '05-beton-moscvich', url: 'https://beton-moscvich.ru/' },
  { slug: '06-beton-gost', url: 'https://beton-gost.ru/' },
  { slug: '07-beton-odin', url: 'https://beton-odin.ru/' },
  { slug: '08-gstbeton', url: 'https://gstbeton.ru/' },
  { slug: '09-betonstar', url: 'https://бетонстар.рф/' },
  { slug: '10-betonmks', url: 'https://betonmks.ru/' },
  { slug: '11-bz-titan', url: 'https://bz-titan.ru/' },
  { slug: '12-mosbetontorg', url: 'https://mosbetontorg.ru/' },
  { slug: '13-gamma-beton', url: 'https://gamma-beton.ru/' },
  { slug: '14-pride-beton', url: 'https://pride-beton.ru/' },
];

const OUT = 'competitors';
const MAX_FULL_HEIGHT = 6000; // чтобы не тащить в Figma полотна на 30 000 px

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const report = [];

for (const site of SITES) {
  const row = { ...site, ok: false };
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: 'ru-RU',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();
  try {
    const res = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    row.status = res?.status() ?? 0;
    row.finalUrl = page.url();
    await page.waitForTimeout(3500);
    try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}

    row.title = await page.title();

    // первый экран
    await page.screenshot({ path: `${OUT}/${site.slug}-hero.jpg`, type: 'jpeg', quality: 82 });

    // прокрутка до низа, чтобы подгрузились ленивые картинки
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const step = () => {
          window.scrollBy(0, 900);
          y += 900;
          if (y > document.body.scrollHeight || y > 20000) { window.scrollTo(0, 0); resolve(); }
          else setTimeout(step, 120);
        };
        step();
      });
    });
    await page.waitForTimeout(1200);

    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    row.pageHeight = h;
    await page.screenshot({
      path: `${OUT}/${site.slug}-full.jpg`,
      type: 'jpeg',
      quality: 78,
      fullPage: h <= MAX_FULL_HEIGHT,
      ...(h > MAX_FULL_HEIGHT ? { clip: { x: 0, y: 0, width: 1440, height: MAX_FULL_HEIGHT } } : {}),
    });

    // мобильный первый экран
    const mctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      locale: 'ru-RU',
      ignoreHTTPSErrors: true,
    });
    const mpage = await mctx.newPage();
    await mpage.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await mpage.waitForTimeout(3000);
    await mpage.screenshot({ path: `${OUT}/${site.slug}-mobile.jpg`, type: 'jpeg', quality: 82 });
    await mctx.close();

    row.ok = true;
    console.log(`ok   ${site.slug}  ${row.status}  h=${h}  ${row.title}`);
  } catch (e) {
    row.error = String(e.message || e).split('\n')[0];
    console.log(`FAIL ${site.slug}  ${row.error}`);
  } finally {
    await ctx.close();
    report.push(row);
  }
}

await browser.close();
await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2) + '\n');

const good = report.filter((r) => r.ok).length;
console.log(`\nСнято ${good} из ${SITES.length}`);
