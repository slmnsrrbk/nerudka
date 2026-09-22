import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
p.on('pageerror', (e) => errors.push(String(e)));
const res = [];
const ok = (name, cond) => res.push([name, !!cond]);
const count = async () => Number(await p.textContent('[data-catalog-count]'));
const rows = async () => await p.locator('[data-catalog-rows] tr:not(.hidden)').count();

await p.goto('http://localhost:4321/catalog/', { waitUntil: 'networkidle' });
const total = await count();
ok(`каталог открывается, позиций ${total}`, total > 100);

// фильтр по виду
await p.locator('[data-facet-option="kind:keramzitobeton"] input').check();
await p.waitForTimeout(150);
const k = await count();
ok(`вид «керамзитобетон» сузил выборку до ${k}`, k > 0 && k < total && k === (await rows()));

// внутри группы фильтры складываются как «или»
await p.locator('[data-facet-option="kind:peskobeton"] input').check();
await p.waitForTimeout(150);
const k2 = await count();
ok(`добавили «пескобетон», стало ${k2}, это больше`, k2 > k);

// между группами как «и»
await p.locator('[data-facet-option="grade:М300"]').click();
await p.waitForTimeout(150);
const k3 = await count();
ok(`марка М300 вместе с двумя видами дала ${k3}`, k3 > 0 && k3 < k2);

// чипсы активных фильтров
const chips = await p.locator('[data-catalog-chips] [data-chip-remove]').count();
ok(`чипсов активных фильтров: ${chips}`, chips === 3);

// адресная строка хранит подборку
const url = p.url();
ok('подборка попала в адресную строку', url.includes('kind=') && url.includes('grade='));

// ссылка с подборкой открывается в том же состоянии
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(200);
ok(`ссылка восстановила выборку (${await count()})`, (await count()) === k3);

// снятие чипса: фильтр уходит из чипсов и из адресной строки
const removed = await p.locator('[data-catalog-chips] [data-chip-remove]').first().getAttribute('data-value');
await p.locator('[data-catalog-chips] [data-chip-remove]').first().click();
await p.waitForTimeout(200);
const chipsLeft = await p.locator('[data-catalog-chips] [data-chip-remove]').count();
ok(`крестик снял фильтр «${removed}», осталось чипсов ${chipsLeft}`, chipsLeft === 2 && !p.url().includes(encodeURIComponent(removed)));

// сброс
await p.locator('[data-facets-reset]').first().click();
await p.waitForTimeout(200);
ok('сброс возвращает весь каталог', (await count()) === total);

// поиск
await p.fill('[data-catalog-search]', 'керамзит');
await p.waitForTimeout(250);
const s = await count();
ok(`поиск «керамзит» нашёл ${s}`, s > 0 && s < total);
await p.fill('[data-catalog-search]', 'такого нет');
await p.waitForTimeout(250);
ok('пустая выдача показывает подсказку', await p.locator('[data-catalog-empty]').isVisible());
await p.fill('[data-catalog-search]', '');
await p.waitForTimeout(200);

// цена
await p.fill('[data-facet-min]', '6000');
await p.waitForTimeout(250);
const pricey = await p.locator('[data-catalog-rows] tr:not(.hidden)').evaluateAll((els) => els.map((e) => Number(e.dataset.price)));
ok(`фильтр по цене от 6000 оставил ${pricey.length}, все дороже`, pricey.length > 0 && pricey.every((v) => v >= 6000));
await p.fill('[data-facet-min]', '');
await p.waitForTimeout(200);

// сортировка
await p.selectOption('[data-catalog-sort]', 'price-asc');
await p.waitForTimeout(250);
const sorted = await p.locator('[data-catalog-rows] tr:not(.hidden)').evaluateAll((els) => els.map((e) => Number(e.dataset.price)));
ok('сортировка по цене по возрастанию работает', sorted.every((v, i, a) => i === 0 || a[i - 1] <= v));

// карточки
await p.locator('[data-view="cards"]').click();
await p.waitForTimeout(150);
ok('переключение на карточки работает', await p.locator('[data-catalog-cards]').isVisible());

// фильтр на странице категории
await p.goto('http://localhost:4321/catalog/beton/tovarnyj/', { waitUntil: 'networkidle' });
const catTotal = await count();
await p.locator('[data-facet-option="filler:гранит"] input').check();
await p.waitForTimeout(200);
const granite = await count();
ok(`на странице категории фильтр по заполнителю: ${granite} из ${catTotal}`, granite > 0 && granite < catTotal);

for (const [name, good] of res) console.log(`${good ? 'OK  ' : 'СБОЙ'} ${name}`);
console.log(errors.length ? 'Ошибки JS: ' + errors.join('; ') : 'Ошибок JS нет');
await b.close();
process.exit(res.every(([, g]) => g) && errors.length === 0 ? 0 : 1);
