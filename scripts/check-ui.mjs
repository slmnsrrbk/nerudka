import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const log = [];
p.on('pageerror', (e) => log.push('JS ERROR: ' + e.message));

// 1. Калькулятор на главной
await p.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
const before = await p.textContent('[data-calc-total]');
await p.selectOption('[data-calc-zone]', 'z4');
await p.fill('[data-calc-volume]', '60');
await p.waitForTimeout(150);
const after = await p.textContent('[data-calc-total]');
const detail = await p.textContent('[data-calc-detail]');
log.push(`калькулятор: ${before.trim()} -> ${after.trim()}`);
log.push(`детализация: ${detail.trim()}`);

// 2. Согласие ПДн блокирует отправку
await p.click('[data-modal-open="callback"]');
const disabledBefore = await p.isDisabled('[data-modal="callback"] [data-submit]');
await p.check('[data-modal="callback"] [data-consent]');
const disabledAfter = await p.isDisabled('[data-modal="callback"] [data-submit]');
log.push(`кнопка без согласия disabled: ${disabledBefore}, с согласием disabled: ${disabledAfter}`);
await p.fill('[data-modal="callback"] input[type="tel"]', '9161234567');
await p.fill('[data-modal="callback"] input[type="text"]', 'Иван');
await p.click('[data-modal="callback"] [data-submit]');
await p.waitForTimeout(200);
log.push('тост: ' + (await p.textContent('[data-toast]')).trim());

// 3. Табы прайса
await p.click('[data-tab="rastvor"]');
await p.waitForTimeout(100);
log.push('панель растворов видна: ' + (await p.isVisible('[data-tab-panel="rastvor"]')));

// 4. Список заявки
await p.goto('http://localhost:4321/catalog/beton/tovarnyj/', { waitUntil: 'networkidle' });
await p.click('[data-add-to-request]');
await p.waitForTimeout(200);
log.push('счётчик заявки: ' + (await p.textContent('[data-request-count]')));
await p.click('[data-request-open]');
await p.waitForTimeout(200);
log.push('итог в панели: ' + (await p.textContent('[data-request-total]')).trim());
await p.click('[data-request-close]');

// 5. Фильтры каталога
await p.locator('[data-facet-option="filler:гранит"] input').check();
await p.waitForTimeout(200);
log.push('видно позиций после фильтра «гранит»: ' + (await p.textContent('[data-catalog-count]')));

// 6. Режим аннотаций (переключатель в верхней строке шапки, она скрывается при скролле)
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(300);
await p.check('[data-annotate-toggle]');
await p.waitForTimeout(150);
log.push('режим аннотаций: ' + (await p.getAttribute('html', 'data-annotate')) + ', бейдж шаблона виден: ' + (await p.isVisible('[data-template-badge]')));
await p.uncheck('[data-annotate-toggle]');

// 7. Калькулятор объёма -> стоимость
await p.goto('http://localhost:4321/calculator/', { waitUntil: 'networkidle' });
await p.click('[data-vc-apply]');
await p.waitForTimeout(200);
log.push('объём из калькулятора: ' + (await p.textContent('[data-vc-reserve]')).trim());

// 8. Переключатель зоны в прайсе
await p.goto('http://localhost:4321/price/', { waitUntil: 'networkidle' });
const cellBefore = await p.textContent('[data-price-cell]');
await p.check('[data-zone-enable]');
await p.waitForTimeout(150);
const cellAfter = await p.textContent('[data-price-cell]');
log.push(`прайс с доставкой: ${cellBefore.trim()} -> ${cellAfter.trim()}`);

console.log(log.join('\n'));
await b.close();
