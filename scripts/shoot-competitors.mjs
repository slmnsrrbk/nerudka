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
const UA_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const UA_MOBILE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

// Куки-баннеры и антибот-заглушки перекрывают первый экран — убираем их,
// иначе скриншот показывает не сайт, а плашку про обработку данных.
async function dismissOverlays(page) {
  await page.evaluate(() => {
    const WORDS = /(соглас|принима|принять|понятно|хорошо|разрешить|accept|agree|got it|ok)/i;
    const COOKIE = /(cookie|куки|персональн|обработк)/i;
    for (const el of document.querySelectorAll('button, a, div[role=button], span')) {
      const t = (el.textContent || '').trim();
      if (t.length < 40 && WORDS.test(t)) {
        const host = el.closest('div, section, aside, footer');
        if (host && COOKIE.test(host.textContent || '')) {
          try { el.click(); } catch {}
        }
      }
    }
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      const t = el.textContent || '';
      if (t.length < 2000 && COOKIE.test(t) && WORDS.test(t)) el.style.setProperty('display', 'none', 'important');
    }
  });
}
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
    userAgent: UA_DESKTOP,
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();
  try {
    let res = null;
    for (let attempt = 1; attempt <= 3 && !res; attempt += 1) {
      try {
        res = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      } catch (e) {
        row.retries = attempt;
        if (attempt === 3) throw e;
        await page.waitForTimeout(3000);
      }
    }
    row.status = res?.status() ?? 0;
    row.finalUrl = page.url();
    // Часть сайтов держит антибот-заглушку 5-8 секунд, поэтому ждём с запасом.
    await page.waitForTimeout(9000);
    try { await page.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
    await dismissOverlays(page);
    await page.waitForTimeout(800);

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
    // clip не работает за пределами вьюпорта, а fullPage с ним несовместим,
    // поэтому просто растягиваем окно до нужной высоты и снимаем как есть.
    const shotHeight = Math.min(h, MAX_FULL_HEIGHT);
    await page.setViewportSize({ width: 1440, height: shotHeight });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${site.slug}-full.jpg`, type: 'jpeg', quality: 72 });
    row.fullHeight = shotHeight;

    // мобильный первый экран
    const mctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
      hasTouch: true,
      locale: 'ru-RU',
      userAgent: UA_MOBILE,
      ignoreHTTPSErrors: true,
    });
    const mpage = await mctx.newPage();
    await mpage.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await mpage.waitForTimeout(8000);
    await dismissOverlays(mpage);
    await mpage.waitForTimeout(600);
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
