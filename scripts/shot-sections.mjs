// Скриншоты разделов главной: node scripts/shot-sections.mjs <папка> [ширина]
import { chromium } from 'playwright';
const [out, width = '1440'] = process.argv.slice(2);
const w = Number(width), mobile = w < 800;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: w, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
await p.goto(process.env.BASE || 'http://localhost:4321/', { waitUntil: 'networkidle' });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 30)); } window.scrollTo({ top: 0, behavior: 'instant' }); });
await p.addStyleTag({ content: '.sticky-bar{display:none!important}' });
await p.waitForTimeout(300);
const ids = await p.evaluate(() => [...document.querySelectorAll('section[id], footer[id]')].map((s) => s.id));
for (const id of ids) await p.locator(`#${id}`).screenshot({ path: `${out}/${w}-${id}.png`, animations: 'disabled' });
console.log(ids.join(' '));
await b.close();
