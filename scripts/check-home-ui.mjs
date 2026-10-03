// Сценарии главной: мегаменю, мобильное меню, поиск, прайс и корзина, формы, калькулятор, слайдеры.
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:4321/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const results = [];
const check = (name, ok, extra = '') => { results.push(ok); console.log(`${ok ? 'OK ' : 'BAD'} ${name}${extra ? ' — ' + extra : ''}`); };
const errs = [];

// Десктоп
let p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(base, { waitUntil: 'load' });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: 'load' });
await p.locator('.nav-hero [data-mega-toggle]').click();
check('мегаменю открывается', await p.locator('[data-mega]').isVisible());
await p.locator('[data-mega-tab="rastvor"]').hover();
check('вкладка «Растворы» переключается', await p.locator('[data-mega-pane="rastvor"]').isVisible());
check('в «Бетоне» 15 марок по дереву', (await p.locator('[data-mega-pane="beton"] .mega-group').first().locator('.mchip').count()) === 15);
await p.keyboard.press('Escape');
check('Esc закрывает мегаменю', await p.locator('[data-mega]').isHidden());

await p.locator('[data-price-tab="kladochnyj"]').click();
check('вкладка прайса «Кладочный раствор»', await p.locator('[data-price-pane="kladochnyj"]').isVisible() && await p.locator('[data-price-pane="tovarnyj"]').isHidden());
await p.locator('[data-price-tab="tovarnyj"]').click();
const cell = p.locator('[data-price-pane="tovarnyj"] .pcell[data-item]').nth(4);
await cell.locator('[data-inc]').click(); await cell.locator('[data-inc]').click();
check('счётчик +2 → 3', (await cell.locator('[data-qty]').inputValue()) === '3');
await cell.locator('[data-qty]').fill('60'); await cell.locator('[data-qty]').press('Tab');
await cell.locator('[data-add]').click();
check('бейдж корзины = 1', (await p.locator('.nav-hero [data-cart-count]').textContent()) === '1');
await p.locator('.nav-hero [data-cart-open]').click();
const disc = await p.locator('[data-cart-disc-label]').textContent();
check('скидка 10 % от 50 м³ в корзине', /10 %/.test(disc), disc);
await p.locator('[data-cart-form] button[type=submit]').click();
check('корзина: без имени/согласия — ошибка', await p.locator('[data-cart-form] [data-form-err]').isVisible());
await p.locator('[data-cart-form] input[name=name]').fill('Иван');
await p.locator('[data-cart-form] input[name=phone]').pressSequentially('9161234567');
check('маска телефона', (await p.locator('[data-cart-form] input[name=phone]').inputValue()) === '+7 (916) 123-45-67');
await p.locator('[data-cart-form] .consent').click();
await p.locator('[data-cart-form] button[type=submit]').click();
check('корзина: заявка отправлена', await p.locator('[data-overlay="cart"] [data-done]').isVisible());
await p.keyboard.press('Escape');

await cell.locator('[data-order]').click();
check('«Заказать» открывает заявку с позицией', /^Бетон М\d+ на (гравии|граните), 60 м³/.test(await p.locator('[data-lead-comment]').inputValue()), await p.locator('[data-lead-comment]').inputValue());
await p.keyboard.press('Escape');

await p.locator('[data-search-open]').first().click();
await p.locator('[data-search-input]').fill('m300 гранит');
check('поиск «m300 гранит»', (await p.locator('[data-search-res] a').count()) >= 1, await p.locator('[data-search-res] a').first().textContent());
await p.keyboard.press('Escape');

await p.locator('[data-calc-type="0"]').click();
check('калькулятор: лента 48×0,4×1,2 = 23 м³', /23/.test(await p.locator('[data-calc-v]').textContent()), await p.locator('[data-calc-v]').textContent());

const sl = p.locator('[data-slider]').first();
await sl.locator('[data-next]').click(); await p.waitForTimeout(700);
check('слайдер РБУ: 2 / 5', (await sl.locator('[data-cur]').textContent()) === '2');
const car = p.locator('[data-carousel]');
await car.scrollIntoViewIfNeeded();
await car.locator('[data-next]').click(); await p.waitForTimeout(800);
check('карусель объектов листается', await car.locator('[data-track]').evaluate((t) => t.scrollLeft > 100));

await p.locator('[data-seo-toggle]').click();
check('SEO «Читать полностью»', await p.locator('[data-seo]').evaluate((s) => s.classList.contains('open')));

await p.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' })); await p.waitForTimeout(400);
check('липкая шапка появляется', await p.locator('[data-sticky]').evaluate((s) => s.classList.contains('on')));
await p.close();

// Мобильный
p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(base, { waitUntil: 'load' });
await p.locator('.nav-hero [data-drawer-open]').click();
check('мобильное меню открывается', await p.locator('[data-drawer]').isVisible());
check('аккордеон: «По марке» раскрыт', await p.locator('.acc-l2[open] .mchip').first().isVisible());
await p.locator('.acc-l1').nth(1).locator(':scope > summary').click();
check('аккордеон: «Растворы» раскрывается', await p.locator('.acc-l1').nth(1).evaluate((d) => d.open));
await p.locator('[data-drawer-close]').first().click();
check('мобильное меню закрывается', await p.locator('[data-drawer]').isHidden());
await p.locator('.hero-form button[type=submit]').click();
check('форма первого экрана: проверка полей', await p.locator('.hero-form [data-form-err]').isVisible());
await p.locator('.hero-form input[name=name]').fill('Анна');
await p.locator('.hero-form input[name=phone]').pressSequentially('89161234567');
await p.locator('.hero-form .consent').click();
await p.locator('.hero-form button[type=submit]').click();
check('форма первого экрана: успех', await p.locator('[data-overlay="lead"] [data-done]').isVisible());
await p.close();

check('нет ошибок JS', !errs.length, errs.join('; '));
await b.close();
process.exit(results.every(Boolean) ? 0 : 1);
