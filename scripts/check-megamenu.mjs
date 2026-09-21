import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });

const open = async () => await p.evaluate(() => getComputedStyle(document.querySelector('[data-mega]')).visibility === 'visible');
const t = await p.locator('[data-mega-trigger]').boundingBox();
const res = [];

await p.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
await p.waitForTimeout(200);
res.push(['наведение на «Каталог» открывает панель', await open()]);

await p.mouse.move(t.x + t.width / 2, t.y + t.height + 8, { steps: 4 });
await p.waitForTimeout(80);
res.push(['панель жива в зазоре между пунктом и панелью', await open()]);

await p.mouse.move(t.x + t.width / 2, 160, { steps: 8 });
await p.waitForTimeout(150);
res.push(['панель жива внутри панели', await open()]);

const far = await p.locator('[data-mega] a', { hasText: 'Цементное молочко' }).first().boundingBox();
await p.mouse.move(far.x + 30, far.y + 8, { steps: 15 });
await p.waitForTimeout(150);
res.push(['панель жива у дальней ссылки «Цементное молочко»', await open()]);

await p.mouse.click(far.x + 30, far.y + 8);
await p.waitForURL('**/cementnoe-molochko/', { timeout: 5000 }).catch(() => {});
await p.waitForLoadState('networkidle');
res.push(['клик по ссылке ведёт на страницу', p.url().includes('cementnoe-molochko')]);

await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
await p.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
await p.waitForTimeout(200);
await p.mouse.move(700, 600, { steps: 10 });
await p.waitForTimeout(350);
res.push(['уход курсора вниз по странице закрывает панель', !(await open())]);

await p.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
await p.waitForTimeout(200);
const price = await p.locator('nav a[href="/price/"]').boundingBox();
await p.mouse.move(price.x + 10, price.y + 10, { steps: 5 });
await p.waitForTimeout(120);
res.push(['наведение на «Прайс» закрывает панель', !(await open())]);

await p.mouse.move(t.x + t.width / 2, t.y + t.height / 2);
await p.waitForTimeout(200);
await p.keyboard.press('Escape');
await p.waitForTimeout(150);
res.push(['Escape закрывает панель', !(await open())]);

for (const [name, ok] of res) console.log(`${ok ? 'OK  ' : 'СБОЙ'} ${name}`);
console.log(errors.length ? 'Ошибки JS: ' + errors.join('; ') : 'Ошибок JS нет');
await b.close();
process.exit(res.every(([, ok]) => ok) ? 0 : 1);
