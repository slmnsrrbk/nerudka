// Клиентская логика прототипа. Расчёты идут через общий модуль lib/price.
import { calc, formatPrice, deliveryPerM3, discountPercent } from '../lib/price';
import { products } from '../lib/catalog';
import site from '../data/site.json';

type Dict = Record<string, string>;

/* ---------- Режим аннотаций ---------- */
const ANNOTATE_KEY = 'proto:annotate';
function applyAnnotate(on: boolean) {
  document.documentElement.setAttribute('data-annotate', on ? 'on' : 'off');
  document.querySelectorAll<HTMLInputElement>('[data-annotate-toggle]').forEach((el) => (el.checked = on));
}
applyAnnotate(localStorage.getItem(ANNOTATE_KEY) === '1');
document.addEventListener('change', (e) => {
  const el = (e.target as HTMLElement)?.closest?.('[data-annotate-toggle]') as HTMLInputElement | null;
  if (!el) return;
  localStorage.setItem(ANNOTATE_KEY, el.checked ? '1' : '0');
  applyAnnotate(el.checked);
});

/* ---------- Мобильное меню ---------- */
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement)?.closest?.('[data-menu-toggle]');
  if (!btn) return;
  document.querySelector('[data-mobile-menu]')?.classList.toggle('hidden');
});

/* ---------- Мегаменю ---------- */
// Между пунктом «Каталог» и панелью есть зазор от вертикальных отступов шапки.
// Курсор проходит его за несколько кадров, поэтому закрываем не сразу, а с паузой,
// и отменяем закрытие, если курсор успел дойти до панели.
const megaRoot = document.querySelector<HTMLElement>('[data-mega-root]');
if (megaRoot) {
  const mega = megaRoot.querySelector<HTMLElement>('[data-mega]');
  const trigger = megaRoot.querySelector<HTMLElement>('[data-mega-trigger]');
  const CLOSE_DELAY = 220;
  let closeTimer: number | undefined;

  const show = (on: boolean) => {
    if (!mega) return;
    mega.classList.toggle('invisible', !on);
    mega.classList.toggle('opacity-0', !on);
    trigger?.setAttribute('aria-expanded', String(on));
  };
  const openNow = () => {
    window.clearTimeout(closeTimer);
    show(true);
  };
  const closeSoon = (delay = CLOSE_DELAY) => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => show(false), delay);
  };

  trigger?.setAttribute('aria-haspopup', 'true');
  trigger?.setAttribute('aria-expanded', 'false');

  trigger?.addEventListener('mouseenter', openNow);
  trigger?.addEventListener('mouseleave', () => closeSoon());
  mega?.addEventListener('mouseenter', openNow);
  mega?.addEventListener('mouseleave', () => closeSoon());

  // Курсор ушёл из шапки совсем: закрываем без ожидания.
  megaRoot.addEventListener('mouseleave', () => closeSoon(0));

  // Наведение на соседний пункт меню закрывает панель сразу,
  // иначе она перекрывает страницу.
  megaRoot.querySelectorAll<HTMLElement>('nav a').forEach((link) => {
    if (link.hasAttribute('data-mega-trigger')) return;
    link.addEventListener('mouseenter', () => closeSoon(0));
  });

  // Клавиатура: открываем по фокусу, закрываем когда фокус ушёл из меню.
  trigger?.addEventListener('focus', openNow);
  megaRoot.addEventListener('focusin', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-mega]') || t.closest('[data-mega-trigger]')) openNow();
  });
  megaRoot.addEventListener('focusout', (e) => {
    const next = (e as FocusEvent).relatedTarget as HTMLElement | null;
    if (!next || !megaRoot.contains(next)) closeSoon(0);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSoon(0);
  });
}

/* ---------- Шапка: уменьшение при скролле ---------- */
const headerTop = document.querySelector<HTMLElement>('[data-header-top]');
const headerMain = document.querySelector<HTMLElement>('[data-header-main]');
const onScroll = () => {
  const small = window.scrollY > 80;
  headerTop?.classList.toggle('hidden', small);
  headerMain?.classList.toggle('py-1.5', small);
  headerMain?.classList.toggle('py-3', !small);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Аккордеоны ---------- */
document.addEventListener('click', (e) => {
  const trigger = (e.target as HTMLElement)?.closest?.('[data-accordion-trigger]') as HTMLElement | null;
  if (!trigger) return;
  const item = trigger.closest('[data-accordion-item]');
  const panel = item?.querySelector('[data-accordion-panel]');
  const icon = item?.querySelector('[data-accordion-icon]');
  if (!panel) return;
  const open = !panel.classList.contains('hidden');
  panel.classList.toggle('hidden', open);
  trigger.setAttribute('aria-expanded', String(!open));
  if (icon) icon.textContent = open ? '+' : '−';
});

/* ---------- Свёрнутый SEO-текст ---------- */
document.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement)?.closest?.('[data-collapse-trigger]') as HTMLElement | null;
  if (!btn) return;
  const panel = btn.closest('[data-collapse]')?.querySelector('[data-collapse-panel]');
  if (!panel) return;
  const hidden = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !hidden);
  btn.textContent = hidden ? 'Свернуть' : 'Читать полностью';
});

/* ---------- Табы ---------- */
document.addEventListener('click', (e) => {
  const tab = (e.target as HTMLElement)?.closest?.('[data-tab]') as HTMLElement | null;
  if (!tab) return;
  const group = tab.closest('[data-tabs]');
  if (!group) return;
  const key = tab.getAttribute('data-tab');
  group.querySelectorAll('[data-tab]').forEach((t) => {
    const active = t === tab;
    t.classList.toggle('border-accent', active);
    t.classList.toggle('text-accent', active);
    t.setAttribute('aria-selected', String(active));
  });
  const scope = group.closest('[data-tabs-scope]') ?? document;
  scope.querySelectorAll('[data-tab-panel]').forEach((p) => {
    p.classList.toggle('hidden', p.getAttribute('data-tab-panel') !== key);
  });
});

/* ---------- Тост ---------- */
let toastTimer: number | undefined;
function toast(text: string) {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = text;
  el.classList.remove('hidden');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.add('hidden'), 4000);
}

/* ---------- Модалки ---------- */
function openModal(name: string, data: Dict = {}) {
  const modal = document.querySelector<HTMLElement>(`[data-modal="${name}"]`);
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  const title = modal.querySelector<HTMLElement>('[data-modal-title]');
  if (title && data.title) title.textContent = data.title;
  const product = modal.querySelector<HTMLSelectElement>('[data-modal-product]');
  if (product && data.product) product.value = data.product;
  const volume = modal.querySelector<HTMLInputElement>('[data-modal-volume]');
  if (volume && data.volume) volume.value = data.volume;
  const zone = modal.querySelector<HTMLSelectElement>('[data-modal-zone]');
  if (zone && data.zone) zone.value = data.zone;
}
function closeModals() {
  document.querySelectorAll<HTMLElement>('[data-modal]').forEach((m) => {
    m.classList.add('hidden');
    m.classList.remove('flex');
  });
  document.body.style.overflow = '';
}
document.addEventListener('click', (e) => {
  const opener = (e.target as HTMLElement)?.closest?.('[data-modal-open]') as HTMLElement | null;
  if (opener) {
    e.preventDefault();
    openModal(opener.getAttribute('data-modal-open') || 'callback', {
      title: opener.getAttribute('data-modal-title') || '',
      product: opener.getAttribute('data-product') || '',
      volume: opener.getAttribute('data-volume') || '',
      zone: opener.getAttribute('data-zone') || '',
    });
    return;
  }
  if ((e.target as HTMLElement)?.closest?.('[data-modal-close]')) closeModals();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModals();
    closeRequest();
  }
});

/* ---------- Формы: согласие обязательно ---------- */
function syncConsent(form: HTMLFormElement) {
  const consent = form.querySelector<HTMLInputElement>('[data-consent]');
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  if (!submit) return;
  submit.disabled = consent ? !consent.checked : false;
}
document.querySelectorAll<HTMLFormElement>('form[data-form]').forEach(syncConsent);
document.addEventListener('change', (e) => {
  const el = (e.target as HTMLElement)?.closest?.('[data-consent]');
  if (!el) return;
  const form = el.closest('form[data-form]') as HTMLFormElement | null;
  if (form) syncConsent(form);
});
document.addEventListener('submit', (e) => {
  const form = (e.target as HTMLElement)?.closest?.('form[data-form]') as HTMLFormElement | null;
  if (!form) return;
  e.preventDefault();
  const consent = form.querySelector<HTMLInputElement>('[data-consent]');
  if (consent && !consent.checked) {
    toast('Нужно согласие на обработку персональных данных');
    return;
  }
  form.reset();
  syncConsent(form);
  closeModals();
  toast('Заявка принята. Это прототип, данные никуда не отправляются.');
});

/* ---------- Маска телефона ---------- */
document.addEventListener('input', (e) => {
  const el = e.target as HTMLInputElement;
  if (!el.matches?.('input[type="tel"]')) return;
  const d = el.value.replace(/\D/g, '').replace(/^8/, '7').replace(/^([^7])/, '7$1').slice(0, 11);
  if (!d) { el.value = ''; return; }
  let out = '+7';
  if (d.length > 1) out += ' (' + d.slice(1, 4);
  if (d.length >= 4) out += ') ' + d.slice(4, 7);
  if (d.length >= 8) out += '-' + d.slice(7, 9);
  if (d.length >= 10) out += '-' + d.slice(9, 11);
  el.value = out;
});

/* ---------- Калькулятор цены ---------- */
function bindPriceCalc(root: HTMLElement) {
  const productSel = root.querySelector<HTMLSelectElement>('[data-calc-product]');
  const volumeInput = root.querySelector<HTMLInputElement>('[data-calc-volume]');
  const zoneSel = root.querySelector<HTMLSelectElement>('[data-calc-zone]');
  const pumpInput = root.querySelector<HTMLInputElement>('[data-calc-pump]');
  const totalOut = root.querySelector<HTMLElement>('[data-calc-total]');
  const perOut = root.querySelector<HTMLElement>('[data-calc-per-m3]');
  const detailOut = root.querySelector<HTMLElement>('[data-calc-detail]');
  const fixedPrice = Number(root.getAttribute('data-calc-price') || 0);

  const update = () => {
    const product = productSel ? products.find((p) => p.id === productSel.value) : undefined;
    const price = product ? product.price : fixedPrice;
    const result = calc({
      price,
      volume: Number(volumeInput?.value || site.minVolume),
      zoneId: zoneSel?.value || site.deliveryZones[0]!.id,
      pump: Boolean(pumpInput?.checked),
    });
    if (totalOut) totalOut.textContent = `от ${formatPrice(result.total)} ₽`;
    if (perOut) perOut.textContent = `${formatPrice(result.perM3)} ₽ за м³ с доставкой`;
    if (detailOut) {
      const parts = [
        `смесь ${formatPrice(result.mix)} ₽`,
        `доставка ${formatPrice(result.delivery)} ₽`,
      ];
      if (result.pump) parts.push(`насос ${formatPrice(result.pump)} ₽`);
      if (result.discount) parts.push(`скидка ${result.discountPercent}%: минус ${formatPrice(result.discount)} ₽`);
      detailOut.textContent = parts.join(', ');
    }
    // Предзаполнение модалки заказа
    const order = root.querySelector<HTMLElement>('[data-modal-open="order"]');
    if (order) {
      if (productSel) order.setAttribute('data-product', productSel.value);
      if (volumeInput) order.setAttribute('data-volume', volumeInput.value);
      if (zoneSel) order.setAttribute('data-zone', zoneSel.value);
    }
  };
  [productSel, volumeInput, zoneSel, pumpInput].forEach((el) => {
    el?.addEventListener('input', update);
    el?.addEventListener('change', update);
  });
  root.querySelectorAll<HTMLElement>('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!volumeInput) return;
      const delta = Number(btn.getAttribute('data-step'));
      const next = Math.max(site.minVolume, Number(volumeInput.value || 0) + delta);
      volumeInput.value = String(next);
      update();
    });
  });
  update();
}
document.querySelectorAll<HTMLElement>('[data-calc="price"]').forEach(bindPriceCalc);

/* ---------- Калькулятор объёма ---------- */
function volumeOf(shape: string, v: Dict): number {
  const n = (k: string) => Number(v[k] || 0);
  if (shape === 'slab') return n('length') * n('width') * n('thickness');
  if (shape === 'strip') return n('perimeter') * n('width') * n('height');
  if (shape === 'columns') return Math.PI * Math.pow(n('diameter') / 2, 2) * n('height') * n('count');
  return 0;
}
function bindVolumeCalc(root: HTMLElement) {
  const shapeSel = root.querySelector<HTMLSelectElement>('[data-vc-shape]');
  const out = root.querySelector<HTMLElement>('[data-vc-result]');
  const outReserve = root.querySelector<HTMLElement>('[data-vc-reserve]');
  const target = document.querySelector<HTMLInputElement>('[data-calc-volume]');

  const update = () => {
    const shape = shapeSel?.value || root.getAttribute('data-vc-default') || 'slab';
    root.querySelectorAll<HTMLElement>('[data-vc-fields]').forEach((f) => {
      f.classList.toggle('hidden', f.getAttribute('data-vc-fields') !== shape);
    });
    const values: Dict = {};
    root.querySelectorAll<HTMLInputElement>(`[data-vc-fields="${shape}"] input`).forEach((i) => {
      values[i.name] = i.value;
    });
    const raw = volumeOf(shape, values);
    const withReserve = raw * 1.05;
    if (out) out.textContent = `${raw.toFixed(2)} м³`;
    if (outReserve) outReserve.textContent = `${withReserve.toFixed(2)} м³ с запасом 5 процентов`;
    root.setAttribute('data-vc-value', withReserve.toFixed(2));
  };
  root.addEventListener('input', update);
  root.addEventListener('change', update);
  root.querySelector('[data-vc-apply]')?.addEventListener('click', () => {
    const value = Math.ceil(Number(root.getAttribute('data-vc-value') || 0));
    if (target && value > 0) {
      target.value = String(value);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      toast(`Объём ${value} м³ подставлен в расчёт стоимости`);
    }
  });
  update();
}
document.querySelectorAll<HTMLElement>('[data-calc="volume"]').forEach(bindVolumeCalc);

/* ---------- Переключатель зоны в прайсе ---------- */
function applyZone(zoneId: string, scope: ParentNode = document) {
  const add = deliveryPerM3(zoneId);
  scope.querySelectorAll<HTMLElement>('[data-price-cell]').forEach((cell) => {
    const base = Number(cell.getAttribute('data-base-price') || 0);
    const withDelivery = cell.getAttribute('data-with-delivery') === 'on';
    cell.textContent = `${formatPrice(withDelivery ? base + add : base)} ₽`;
  });
}
document.querySelectorAll<HTMLSelectElement>('[data-zone-switch]').forEach((sel) => {
  const apply = () => {
    document.querySelectorAll<HTMLElement>('[data-price-cell]').forEach((cell) => {
      cell.setAttribute('data-with-delivery', 'on');
    });
    applyZone(sel.value);
    document.querySelectorAll<HTMLElement>('[data-zone-name]').forEach((el) => {
      const zone = site.deliveryZones.find((z) => z.id === sel.value);
      el.textContent = zone ? zone.name.toLowerCase() : '';
    });
  };
  sel.addEventListener('change', apply);
});
document.querySelectorAll<HTMLInputElement>('[data-zone-enable]').forEach((toggle) => {
  toggle.addEventListener('change', () => {
    const sel = document.querySelector<HTMLSelectElement>('[data-zone-switch]');
    document.querySelectorAll<HTMLElement>('[data-price-cell]').forEach((cell) => {
      cell.setAttribute('data-with-delivery', toggle.checked ? 'on' : 'off');
    });
    applyZone(sel?.value || site.deliveryZones[0]!.id);
  });
});

/* ---------- Поиск по спискам (гео, FAQ, документы) ---------- */
document.querySelectorAll<HTMLInputElement>('[data-filter-input]').forEach((input) => {
  const targetSel = input.getAttribute('data-filter-input') || '[data-filter-item]';
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    document.querySelectorAll<HTMLElement>(targetSel).forEach((item) => {
      const text = (item.getAttribute('data-search-text') || item.textContent || '').toLowerCase();
      item.classList.toggle('hidden', q.length > 0 && !text.includes(q));
    });
    document.querySelectorAll<HTMLElement>('[data-filter-group]').forEach((group) => {
      const visible = group.querySelectorAll(`${targetSel}:not(.hidden)`).length;
      group.classList.toggle('hidden', visible === 0);
    });
  });
});

/* ---------- Фильтры-чипсы (проекты, документы, блог) ---------- */
document.addEventListener('click', (e) => {
  const chip = (e.target as HTMLElement)?.closest?.('[data-filter-value]') as HTMLElement | null;
  if (!chip) return;
  const group = chip.closest('[data-filter-group-name]');
  const value = chip.getAttribute('data-filter-value') || 'all';
  group?.querySelectorAll('[data-filter-value]').forEach((c) => {
    const active = c === chip;
    c.classList.toggle('border-accent', active);
    c.classList.toggle('text-accent', active);
  });
  document.querySelectorAll<HTMLElement>('[data-filter-key]').forEach((item) => {
    const key = item.getAttribute('data-filter-key') || '';
    item.classList.toggle('hidden', value !== 'all' && key !== value);
  });
});

/* ---------- Список заявки ---------- */
const REQUEST_KEY = 'proto:request';
type RequestItem = { id: string; name: string; price: number; volume: number };

function readRequest(): RequestItem[] {
  try {
    return JSON.parse(localStorage.getItem(REQUEST_KEY) || '[]') as RequestItem[];
  } catch {
    return [];
  }
}
function writeRequest(items: RequestItem[]) {
  localStorage.setItem(REQUEST_KEY, JSON.stringify(items));
  renderRequest();
}
function renderRequest() {
  const items = readRequest();
  const counter = document.querySelector<HTMLElement>('[data-request-count]');
  const btn = document.querySelector<HTMLElement>('[data-request-open]');
  const list = document.querySelector<HTMLElement>('[data-request-items]');
  const total = document.querySelector<HTMLElement>('[data-request-total]');
  if (counter) counter.textContent = String(items.length);
  btn?.classList.toggle('hidden', items.length === 0);
  btn?.classList.toggle('flex', items.length > 0);
  if (list) {
    list.innerHTML = items.length
      ? items
          .map(
            (i) => `<div class="mb-3 rounded-md border border-line p-3" data-request-row="${i.id}">
              <div class="font-medium">${i.name}</div>
              <div class="mt-1 text-xs text-ink-2">${formatPrice(i.price)} ₽ за м³</div>
              <div class="mt-2 flex items-center gap-2">
                <button type="button" data-request-minus="${i.id}" class="size-7 rounded-md border border-line">−</button>
                <span>${i.volume} м³</span>
                <button type="button" data-request-plus="${i.id}" class="size-7 rounded-md border border-line">+</button>
                <button type="button" data-request-remove="${i.id}" class="ml-auto text-xs text-ink-2 hover:text-ink">удалить</button>
              </div>
            </div>`,
          )
          .join('')
      : '<p class="text-ink-2">Список пуст. Добавьте позиции кнопкой «В заявку» в каталоге.</p>';
  }
  if (total) {
    const sum = items.reduce((acc, i) => acc + i.price * i.volume, 0);
    const percent = discountPercent(items.reduce((acc, i) => acc + i.volume, 0));
    total.textContent = percent
      ? `${formatPrice(sum - (sum * percent) / 100)} ₽ со скидкой ${percent}%`
      : `${formatPrice(sum)} ₽`;
  }
}
function openRequest() {
  const panel = document.querySelector<HTMLElement>('[data-request-panel]');
  panel?.classList.remove('hidden');
  panel?.classList.add('flex');
  document.body.style.overflow = 'hidden';
}
function closeRequest() {
  const panel = document.querySelector<HTMLElement>('[data-request-panel]');
  panel?.classList.add('hidden');
  panel?.classList.remove('flex');
  document.body.style.overflow = '';
}
document.addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  const add = el.closest?.('[data-add-to-request]') as HTMLElement | null;
  if (add) {
    e.preventDefault();
    const id = add.getAttribute('data-id') || '';
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const items = readRequest();
    const existing = items.find((i) => i.id === id);
    const volume = Number(add.getAttribute('data-volume') || 10);
    if (existing) existing.volume += volume;
    else items.push({ id, name: product.name, price: product.price, volume });
    writeRequest(items);
    toast(`${product.name} в списке заявки`);
    return;
  }
  if (el.closest?.('[data-request-open]')) { openRequest(); return; }
  if (el.closest?.('[data-request-close]')) { closeRequest(); return; }

  const plus = el.closest?.('[data-request-plus]') as HTMLElement | null;
  const minus = el.closest?.('[data-request-minus]') as HTMLElement | null;
  const remove = el.closest?.('[data-request-remove]') as HTMLElement | null;
  if (plus || minus || remove) {
    const id = (plus || minus || remove)!.getAttribute(
      plus ? 'data-request-plus' : minus ? 'data-request-minus' : 'data-request-remove',
    );
    let items = readRequest();
    if (remove) items = items.filter((i) => i.id !== id);
    else {
      const item = items.find((i) => i.id === id);
      if (item) item.volume = Math.max(site.minVolume, item.volume + (plus ? 1 : -1));
    }
    writeRequest(items);
  }
});
renderRequest();

/* ---------- Фильтры каталога и переключатель вида ---------- */
const filtersRoot = document.querySelector<HTMLElement>('[data-catalog-filters]');
if (filtersRoot) {
  const selects = Array.from(filtersRoot.querySelectorAll<HTMLSelectElement>('[data-filter-field]'));
  const countOut = document.querySelector<HTMLElement>('[data-visible-count]');

  const applyFilters = () => {
    const conditions = selects
      .map((s) => ({ field: s.getAttribute('data-filter-field') || '', value: s.value }))
      .filter((c) => c.value);
    let visible = 0;
    document.querySelectorAll<HTMLElement>('[data-product-row], [data-product-card]').forEach((item) => {
      const ok = conditions.every((c) => item.getAttribute(`data-${c.field}`) === c.value);
      item.classList.toggle('hidden', !ok);
      if (ok && item.hasAttribute('data-product-row')) visible += 1;
    });
    if (countOut) countOut.textContent = String(visible);
  };
  selects.forEach((s) => s.addEventListener('change', applyFilters));

  filtersRoot.querySelectorAll<HTMLElement>('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      filtersRoot.querySelectorAll<HTMLElement>('[data-view]').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('border-accent', active);
        b.classList.toggle('text-accent', active);
        b.classList.toggle('border-line', !active);
      });
      document.querySelectorAll<HTMLElement>('[data-view-panel]').forEach((panel) => {
        const on = panel.getAttribute('data-view-panel') === view;
        panel.classList.toggle('hidden', !on);
        if (on && view === 'cards') panel.classList.add('grid');
      });
    });
  });
  applyFilters();
}

/* ---------- Кликабельные строки таблиц ---------- */
document.addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  if (el.closest('a, button, input, select')) return;
  const row = el.closest?.('[data-row-href]') as HTMLElement | null;
  if (!row) return;
  const href = row.getAttribute('data-row-href');
  if (href) window.location.href = href;
});

export {};
