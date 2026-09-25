// Полный разбор главных страниц конкурентов для сравнительной таблицы:
// шапка, первый экран, блоки сверху вниз с текстом, формы, цены, мессенджеры,
// виджеты и снимки всей страницы кусками в половинном масштабе.
// Запускается на раннере GitHub: из контейнера разработки эти домены закрыты.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const SITES = process.env.AUDIT_URL ? [{ slug: 'local', url: process.env.AUDIT_URL }] : [
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
const ONLY = process.env.AUDIT_ONLY || '';
const OUT = process.env.AUDIT_OUT || 'competitors/audit';
const SLICE = 8000; // css px на один снимок; при масштабе 0.5 это 4000 px картинки
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const summary = [];

for (const site of SITES.filter((x) => !ONLY || ONLY.split(',').includes(x.slug))) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 0.5, locale: 'ru-RU', userAgent: UA });
  const page = await ctx.newPage();
  try {
    let ok = false;
    for (let i = 0; i < 3 && !ok; i++) {
      try { await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 90000 }); ok = true; } catch (e) { if (i === 2) throw e; await page.waitForTimeout(15000); }
    }
    await page.waitForTimeout(9000);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 160)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(2500);

    const data = await page.evaluate(() => {
      const abs = (el) => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) }; };
      const shown = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && r.width > 0 && r.height > 0; };
      const clean = (s) => (s || '').replace(/[ \t ]+/g, ' ').replace(/\s*\n\s*/g, '\n').replace(/\n{2,}/g, '\n').trim();

      // видимые текстовые узлы в порядке документа с абсолютной высотой
      const nodes = [];
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => {
          const p = n.parentElement;
          if (!p || !n.textContent.trim()) return NodeFilter.FILTER_REJECT;
          if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SVG)$/i.test(p.tagName)) return NodeFilter.FILTER_REJECT;
          return shown(p) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
      });
      while (tw.nextNode()) { const n = tw.currentNode; const p = n.parentElement; nodes.push({ p, t: n.textContent.trim(), top: abs(p).top }); }

      // заголовки секций: h1/h2, а если h2 мало — ещё h3
      let hs = [...document.querySelectorAll('h1,h2')].filter(shown);
      if (hs.length < 5) hs = [...document.querySelectorAll('h1,h2,h3')].filter(shown);
      hs = hs.filter((h) => clean(h.innerText).length > 2 && !h.closest('header, footer, nav'));
      const sections = [];
      const pos = (el) => nodes.findIndex((n) => el.contains(n.p) || n.p === el);
      const idx = hs.map((h) => ({ h, i: pos(h) })).filter((x) => x.i >= 0).sort((a, b) => a.i - b.i);
      for (let k = 0; k < idx.length; k++) {
        const { h, i } = idx[k];
        const end = k + 1 < idx.length ? idx[k + 1].i : nodes.length;
        const chunk = nodes.slice(i, end).filter((n) => !n.p.closest('footer'));
        const top = abs(h).top;
        const bottom = k + 1 < idx.length ? abs(idx[k + 1].h).top : document.documentElement.scrollHeight;
        sections.push({ heading: clean(h.innerText), level: h.tagName.toLowerCase(), top, text: clean(chunk.map((n) => n.t).join('\n')).slice(0, 1500), height: bottom - top });
      }

      // что внутри каждой секции по высоте
      const inRange = (el, s) => { const t = abs(el).top; return t >= s.top - 20 && t < s.top + s.height; };
      const forms = [...document.querySelectorAll('form')].filter(shown).map((f) => ({
        top: abs(f).top,
        fields: [...f.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')].filter(shown).map((i) => i.placeholder || i.name || i.type).slice(0, 8),
        button: clean([...f.querySelectorAll('button, input[type=submit], .btn, [class*=button]')].filter(shown).map((b) => b.innerText || b.value).join(' | ')).slice(0, 120),
      }));
      const frames = [...document.querySelectorAll('iframe')].map((f) => ({ top: abs(f).top, src: (f.src || f.dataset.src || '').slice(0, 120) }));
      const videos = [...document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="rutube"], iframe[src*="vk.com"], iframe[src*="vkvideo"], [class*="video"], [data-fancybox][href*="youtu"]')].filter(shown).length;
      for (const s of sections) {
        s.forms = forms.filter((f) => f.top >= s.top - 20 && f.top < s.top + s.height).length;
        s.inputs = [...document.querySelectorAll('input:not([type=hidden]), textarea, select')].filter((i) => shown(i) && inRange(i, s)).length;
        s.buttons = [...new Set([...document.querySelectorAll('button, a[class*=btn], a[class*=button], .btn')].filter((b) => shown(b) && inRange(b, s)).map((b) => clean(b.innerText)).filter((x) => x && x.length < 40))].slice(0, 8);
        s.images = [...document.querySelectorAll('img')].filter((i) => shown(i) && inRange(i, s) && i.getBoundingClientRect().width > 80).length;
        s.iframes = frames.filter((f) => f.top >= s.top - 20 && f.top < s.top + s.height).map((f) => f.src.split('/')[2] || 'iframe');
        s.tables = [...document.querySelectorAll('table')].filter((t) => shown(t) && inRange(t, s)).length;
      }

      const html = document.documentElement.outerHTML;
      const bodyText = document.body.innerText;
      const links = [...document.querySelectorAll('a[href]')].map((a) => a.href);
      const has = (re) => links.some((h) => re.test(h));
      const header = document.querySelector('header') || document.querySelector('[class*=header]');
      const firstScreen = clean(nodes.filter((n) => n.top < 900 && !(header && header.contains(n.p))).map((n) => n.t).join('\n')).slice(0, 1500);
      const fixed = [...document.querySelectorAll('body *')].filter((el) => { const cs = getComputedStyle(el); return (cs.position === 'fixed' || cs.position === 'sticky') && shown(el); }).map((el) => clean(el.innerText).slice(0, 80)).filter(Boolean).slice(0, 12);
      const navTop = [...document.querySelectorAll('header nav > ul > li > a, header nav > a, nav > ul > li > a, [class*=menu] > ul > li > a, [class*=menu] > li > a')].filter(shown).map((a) => clean(a.innerText)).filter((s) => s && s.length < 40);
      const prices = [...new Set((bodyText.match(/(?:от\s*)?\d[\d\s]{2,6}(?:[.,]\d+)?\s*(?:₽|руб|р\.|р\/)/gi) || []).map((s) => s.replace(/\s+/g, ' ').trim()))].slice(0, 25);
      const discounts = [...new Set((bodyText.match(/скидк\S*[^.\n]{0,40}/gi) || []).map((s) => s.trim()))].slice(0, 12);
      const facts = [...new Set((bodyText.match(/[^.\n]{0,50}(?:миксер|самосвал|насос|лет на рынке|с 20\d\d|ИНН|ГОСТ|лаборатор|гарант|отсрочк|24\/7|круглосуточ)[^.\n]{0,50}/gi) || []).map((s) => clean(s)))].slice(0, 25);

      return {
        title: document.title,
        description: document.querySelector('meta[name=description]')?.content || '',
        height: document.documentElement.scrollHeight,
        header: clean(header?.innerText || '').slice(0, 800),
        nav: [...new Set(navTop)].slice(0, 30),
        firstScreen,
        sections,
        forms,
        footer: clean(document.querySelector('footer')?.innerText || '').slice(0, 1500),
        fixed,
        features: {
          telegram: has(/t\.me|telegram/i), whatsapp: has(/wa\.me|whatsapp/i), max: has(/max\.ru/i), vk: has(/vk\.com/i),
          phoneLinks: [...new Set(links.filter((h) => h.startsWith('tel:')).map((h) => h.slice(4)))].slice(0, 5),
          cart: /корзин/i.test(bodyText), quiz: /готово\s*:?\s*\d+\s*%|шаг\s*\d\s*(из|\/)/i.test(bodyText),
          calculator: /калькулятор|рассчитать стоимость|расчёт стоимости|расчет стоимости/i.test(bodyText),
          videos, iframes: [...new Set(frames.map((f) => f.src.split('/')[2]).filter(Boolean))],
          chat: ['jivo', 'bitrix24', 'callbackhunter', 'envybox', 'carrotquest', 'livetex', 'talk-me', 'marquiz', 'amocrm', 'roistat', 'calltouch', 'callibri', 'yandex.ru/map', 'api-maps.yandex'].filter((k) => html.includes(k)),
          cms: /bitrix/i.test(html) ? '1С-Битрикс' : /wp-content/i.test(html) ? 'WordPress' : /tilda/i.test(html) ? 'Tilda' : /modx/i.test(html) ? 'MODX' : '',
          reviewsWidget: /yandex\.ru\/maps-reviews|reviews-widget|2gis/i.test(html),
        },
        prices, discounts, facts,
      };
    });
    await writeFile(`${OUT}/${site.slug}.json`, JSON.stringify({ url: site.url, ...data }, null, 2) + '\n');

    let n = 0;
    for (let y = 0; y < data.height && n < 5; y += SLICE, n++) {
      const h = Math.min(SLICE, data.height - y);
      await page.setViewportSize({ width: 1440, height: h });
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${OUT}/${site.slug}-p${n + 1}.jpg`, type: 'jpeg', quality: 72 });
    }
    summary.push({ slug: site.slug, ok: true, sections: data.sections.length, height: data.height, slices: n });
    console.log(`ok ${site.slug}: ${data.sections.length} секций, высота ${data.height}, снимков ${n}`);
  } catch (e) {
    summary.push({ slug: site.slug, ok: false, error: String(e.message || e).split('\n')[0] });
    console.log(`FAIL ${site.slug}: ${String(e.message || e).split('\n')[0]}`);
  } finally { await ctx.close(); }
}
if (!ONLY) await writeFile(`${OUT}/summary.json`, JSON.stringify(summary, null, 2) + '\n');
await browser.close();
