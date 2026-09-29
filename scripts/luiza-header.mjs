// Снимает шапку и первый экран кейса на luizaevent.ru: скриншоты, разметку шапки,
// логотип и шрифты. Запускается на раннере GitHub Actions (из контейнера сайт закрыт).
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const URL = process.env.CASE_URL || 'https://luizaevent.ru/ilya_and_elizabeth';
const OUT = 'luiza/source/header';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${name}-top.png` });
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}-scrolled.png` });

  if (name === 'desktop') {
    const info = await page.evaluate(() => {
      const recs = [...document.querySelectorAll('#allrecords .r')].slice(0, 5);
      const fonts = {};
      for (const el of document.querySelectorAll('.tn-atom, a, button')) {
        const cs = getComputedStyle(el);
        const t = (el.innerText || '').trim().slice(0, 40);
        if (!t) continue;
        const k = `${cs.fontFamily} | ${cs.fontWeight} | ${cs.fontSize} | ${cs.textTransform} | ${cs.letterSpacing}`;
        (fonts[k] ||= []).length < 4 && fonts[k].push(t);
      }
      const assets = [...document.querySelectorAll('img, [data-original], .tn-atom__img, svg')]
        .slice(0, 60)
        .map((el) => ({
          tag: el.tagName, cls: el.className?.baseVal ?? el.className,
          src: el.getAttribute('data-original') || el.getAttribute('src') || '',
          rect: (({ x, y, width, height }) => ({ x, y, width, height }))(el.getBoundingClientRect()),
          svg: el.tagName.toLowerCase() === 'svg' ? el.outerHTML.slice(0, 20000) : undefined,
        }))
        .filter((a) => a.rect.y < 200 && a.rect.width > 0);
      return {
        fonts,
        assets,
        fontFaces: [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
          .filter((r) => r.constructor.name === 'CSSFontFaceRule').map((r) => r.cssText.slice(0, 300)),
        html: recs.map((r) => r.outerHTML).join('\n\n').slice(0, 300000),
      };
    });
    for (const a of info.assets) {
      if (!a.src || a.svg) continue;
      try {
        const res = await fetch(a.src.split('?')[0]);
        const name = a.src.split('?')[0].split('/').pop();
        await writeFile(`${OUT}/${name}`, Buffer.from(await res.arrayBuffer()));
        a.file = name;
      } catch (e) { a.error = String(e); }
    }
    await writeFile(`${OUT}/header.html`, info.html);
    delete info.html;
    await writeFile(`${OUT}/info.json`, JSON.stringify(info, null, 2));
  }
  await page.close();
}
await browser.close();
console.log('Готово');
