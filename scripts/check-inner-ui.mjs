// Проверка интерактива внутренних страниц: прайс категории, карточка позиции, фильтры, поиск, корзина.
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://localhost:4321';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
let bad = 0;
const ok = (cond, name, extra = '') => { if (!cond) bad++; console.log(`${cond ? 'OK ' : 'BAD'} ${name}${extra ? ` — ${extra}` : ''}`); };
const go = (path) => p.goto(base + path, { waitUntil: 'load' });

// Категория: «Показать ещё» открывает остальные группы
await go('/catalog/beton/');
const hidden0 = await p.locator('[data-pgroup][hidden]').count();
await p.click('[data-pmore]');
ok(hidden0 > 0 && (await p.locator('[data-pgroup][hidden]').count()) === 0, 'категория: «Показать ещё» раскрывает прайс', `скрыто было ${hidden0}`);

// Позиция: пресет 50 м³ → сумма со скидкой 10 %
await go('/catalog/beton/tovarnyj/beton-m300-gravij/');
await p.click('[data-buy] [data-preset="50"]');
const total = await p.textContent('[data-buy-total]');
ok(total.replace(/\D/g, '') === String(Math.round(5260 * 50 * 0.9)), 'позиция: 50 м³ со скидкой 10 %', total);
await p.click('[data-buy] [data-add]');
ok((await p.textContent('[data-cart-count]')) === '1', 'позиция: «В корзину» — бейдж 1');

// Назначение: фильтр по заполнителю
await go('/beton/dlya-fundament/');
const all = await p.locator('[data-frow]:visible').count();
await p.locator('.fcheck', { hasText: 'Гравий' }).click();
const grav = await p.locator('[data-frow]:visible').count();
const txt = await p.textContent('[data-ftotal]');
ok(grav > 0 && grav < all && txt.includes(String(grav)), 'назначение: фильтр «Гравий»', `${all} → ${grav}, «${txt}»`);
await p.click('[data-freset]');
await p.waitForTimeout(50);
ok((await p.locator('[data-frow]:visible').count()) === all, 'назначение: «Сбросить» возвращает все');

// Поиск: результаты, вкладки, «Показать ещё»
await go('/poisk/?q=' + encodeURIComponent('м300'));
const n0 = await p.locator('[data-spos] .prow').count();
await p.click('[data-smore]');
const n1 = await p.locator('[data-spos] .prow').count();
ok(n0 === 8 && n1 > 8, 'поиск: 8 позиций и «Показать ещё»', `${n0} → ${n1}`);
await p.click('[data-stab="sec"]');
ok(await p.locator('[data-sblock="pos"]').isHidden() && await p.locator('[data-sblock="sec"]').isVisible(), 'поиск: вкладка «Разделы»');
await go('/poisk/?q=qqqzzz');
ok(await p.locator('[data-sempty]').isVisible(), 'поиск: пустой результат');

// Корзина: позиция из «Позиции», +1, очистка, заявка
await go('/korzina/');
ok((await p.locator('.krow[data-id]').count()) === 1, 'корзина: позиция из карточки на месте');
await p.click('.krow [data-kinc]');
ok((await p.inputValue('.krow [data-kqty]')) === '51', 'корзина: +1 м³', await p.inputValue('.krow [data-kqty]'));
ok((await p.textContent('[data-ktotal]')).replace(/\D/g, '') === String(Math.round(5260 * 51 * 0.9)), 'корзина: итог со скидкой');
await p.fill('#kform [name="name"]', 'Иван');
await p.fill('#kform [name="phone"]', '9990000000');
await p.check('#kform [name="consent"]', { force: true });
await p.click('[data-ksend]');
ok(await p.locator('[data-kpage] [data-done]').isVisible(), 'корзина: заявка отправлена');
await go('/korzina/');
ok(await p.locator('[data-kempty]').isVisible(), 'корзина: после заявки пусто');

// Контакты: форма
await go('/kontakty/');
await p.click('.cwrite-f [type="submit"]');
ok(await p.locator('.cwrite-f [data-form-err]').isVisible(), 'контакты: без полей — ошибка');

ok(!errs.length, 'нет ошибок JS', errs.join('; '));
await b.close();
process.exit(bad ? 1 : 0);
