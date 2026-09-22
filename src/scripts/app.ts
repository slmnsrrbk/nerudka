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

/* ---------- Каталог с фасетным фильтром ---------- */
// Фильтры внутри одной группы работают как «или», между группами как «и».
// Состояние пишется в адресную строку, чтобы подборкой можно было поделиться.
const FACET_KEYS = ['kind', 'purpose', 'grade', 'class', 'density', 'filler', 'mobility', 'frost', 'water'];

function initCatalog(root: HTMLElement) {
  const products = Array.from(root.querySelectorAll<HTMLElement>('[data-product]'));
  const rowsBox = root.querySelector<HTMLElement>('[data-catalog-rows]');
  const cardsBox = root.querySelector<HTMLElement>('[data-catalog-cards]');
  const countOut = root.querySelector<HTMLElement>('[data-catalog-count]');
  const chipsBox = root.querySelector<HTMLElement>('[data-catalog-chips]');
  const emptyBox = root.querySelector<HTMLElement>('[data-catalog-empty]');
  const searchInput = root.querySelector<HTMLInputElement>('[data-catalog-search]');
  const sortSelect = root.querySelector<HTMLSelectElement>('[data-catalog-sort]');
  const minInput = root.querySelector<HTMLInputElement>('[data-facet-min]');
  const maxInput = root.querySelector<HTMLInputElement>('[data-facet-max]');
  const badge = root.querySelector<HTMLElement>('[data-facets-badge]');
  const panel = root.querySelector<HTMLElement>('[data-facets]');
  const boxes = Array.from(root.querySelectorAll<HTMLInputElement>('[data-facet]'));

  // Запоминаем исходный порядок, он же «сначала популярные».
  products.forEach((el, i) => el.setAttribute('data-order', String(i)));

  const gradeNum = (el: HTMLElement) => {
    const raw = (el.getAttribute('data-grade') || el.getAttribute('data-density') || '').replace(/[^\d]/g, '');
    return raw ? Number(raw) : Number.MAX_SAFE_INTEGER;
  };

  const selected = () => {
    const map: Record<string, string[]> = {};
    for (const key of FACET_KEYS) {
      map[key] = boxes.filter((b) => b.getAttribute('data-facet') === key && b.checked).map((b) => b.value);
    }
    return map;
  };

  const matches = (el: HTMLElement, chosen: Record<string, string[]>, skip?: string) => {
    for (const key of FACET_KEYS) {
      if (key === skip) continue;
      const values = chosen[key];
      if (!values || values.length === 0) continue;
      const own = (el.getAttribute(`data-${key}`) || '').split(',').map((v) => v.trim());
      if (!values.some((v) => own.includes(v))) return false;
    }
    const price = Number(el.getAttribute('data-price') || 0);
    const min = Number(minInput?.value || 0);
    const max = Number(maxInput?.value || 0);
    if (min && price < min) return false;
    if (max && price > max) return false;
    const q = (searchInput?.value || '').trim().toLowerCase();
    if (q && !(el.getAttribute('data-name') || '').includes(q)) return false;
    return true;
  };

  const labelFor = (key: string, value: string) => {
    const option = root.querySelector<HTMLElement>(`[data-facet-option="${key}:${value}"]`);
    const text = option?.textContent?.trim().replace(/\s+/g, ' ') || value;
    return text.replace(/\s\d+$/, '');
  };

  const syncUrl = (chosen: Record<string, string[]>) => {
    const params = new URLSearchParams();
    for (const key of FACET_KEYS) if (chosen[key]!.length) params.set(key, chosen[key]!.join(','));
    if (minInput?.value) params.set('min', minInput.value);
    if (maxInput?.value) params.set('max', maxInput.value);
    if (searchInput?.value) params.set('q', searchInput.value);
    if (sortSelect && sortSelect.value !== 'popular') params.set('sort', sortSelect.value);
    const qs = params.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  };

  const apply = () => {
    const chosen = selected();
    let visible = 0;
    products.forEach((el) => {
      const ok = matches(el, chosen);
      el.classList.toggle('hidden', !ok);
      if (ok && el.tagName === 'TR') visible += 1;
      else if (ok && el.tagName !== 'TR' && !rowsBox) visible += 1;
    });
    if (!rowsBox) visible = products.filter((el) => !el.classList.contains('hidden')).length;
    if (countOut) countOut.textContent = String(visible);
    emptyBox?.classList.toggle('hidden', visible > 0);

    // Счётчики у вариантов: сколько найдётся, если добавить этот вариант.
    for (const key of FACET_KEYS) {
      boxes.filter((b) => b.getAttribute('data-facet') === key).forEach((b) => {
        const rest = { ...chosen, [key]: [b.value] };
        const n = products.filter((el) => el.tagName === 'TR' || !rowsBox).filter((el) => matches(el, rest, undefined)).length;
        const holder = b.closest('[data-facet-option]')?.querySelector('[data-facet-count]');
        if (holder) holder.textContent = n ? ` ${n}` : ' 0';
        const option = b.closest('[data-facet-option]') as HTMLElement | null;
        option?.classList.toggle('opacity-40', n === 0 && !b.checked);
      });
    }

    // Чипсы активных фильтров.
    if (chipsBox) {
      const chips: string[] = [];
      for (const key of FACET_KEYS) {
        for (const value of chosen[key]!) {
          chips.push(`<button type="button" data-chip-remove data-key="${key}" data-value="${value}" class="inline-flex items-center gap-1 rounded-md border border-accent px-2 py-1 text-xs text-accent">${labelFor(key, value)} <span aria-hidden="true">×</span></button>`);
        }
      }
      if (minInput?.value || maxInput?.value) {
        chips.push(`<button type="button" data-chip-remove data-key="price" data-value="" class="inline-flex items-center gap-1 rounded-md border border-accent px-2 py-1 text-xs text-accent">цена ${minInput?.value || '0'} : ${maxInput?.value || '∞'} <span aria-hidden="true">×</span></button>`);
      }
      chipsBox.innerHTML = chips.join('');
    }

    const total = Object.values(chosen).reduce((acc, v) => acc + v.length, 0);
    if (badge) {
      badge.textContent = String(total);
      badge.classList.toggle('hidden', total === 0);
    }
    syncUrl(chosen);
  };

  const sortProducts = () => {
    const mode = sortSelect?.value || 'popular';
    const sorter = (a: HTMLElement, b: HTMLElement) => {
      if (mode === 'price-asc') return Number(a.dataset.price) - Number(b.dataset.price);
      if (mode === 'price-desc') return Number(b.dataset.price) - Number(a.dataset.price);
      if (mode === 'grade-asc') return gradeNum(a) - gradeNum(b);
      if (mode === 'name') return (a.dataset.name || '').localeCompare(b.dataset.name || '', 'ru');
      return Number(a.dataset.order) - Number(b.dataset.order);
    };
    [rowsBox, cardsBox].forEach((box) => {
      if (!box) return;
      Array.from(box.children as HTMLCollectionOf<HTMLElement>)
        .sort(sorter)
        .forEach((el) => box.appendChild(el));
    });
  };

  boxes.forEach((b) => b.addEventListener('change', apply));
  [minInput, maxInput, searchInput].forEach((el) => el?.addEventListener('input', apply));
  sortSelect?.addEventListener('change', () => { sortProducts(); apply(); });

  root.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest?.('[data-chip-remove]') as HTMLElement | null;
    if (chip) {
      const key = chip.getAttribute('data-key');
      if (key === 'price') {
        if (minInput) minInput.value = '';
        if (maxInput) maxInput.value = '';
      } else {
        boxes.filter((b) => b.getAttribute('data-facet') === key && b.value === chip.getAttribute('data-value'))
          .forEach((b) => (b.checked = false));
      }
      apply();
      return;
    }
    if ((e.target as HTMLElement).closest?.('[data-facets-reset]')) {
      boxes.forEach((b) => (b.checked = false));
      if (minInput) minInput.value = '';
      if (maxInput) maxInput.value = '';
      if (searchInput) searchInput.value = '';
      apply();
      return;
    }
    if ((e.target as HTMLElement).closest?.('[data-facets-open]')) {
      panel?.classList.toggle('hidden');
      panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  // Переключатель вида списка.
  root.querySelectorAll<HTMLElement>('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      root.querySelectorAll<HTMLElement>('[data-view]').forEach((b) => {
        const active = b === btn;
        b.classList.toggle('border-accent', active);
        b.classList.toggle('text-accent', active);
        b.classList.toggle('border-line', !active);
      });
      root.querySelectorAll<HTMLElement>('[data-view-panel]').forEach((p) => {
        p.classList.toggle('hidden', p.getAttribute('data-view-panel') !== view);
      });
    });
  });

  // Стартовое состояние из адресной строки.
  const params = new URLSearchParams(location.search);
  FACET_KEYS.forEach((key) => {
    const raw = params.get(key);
    if (!raw) return;
    const values = raw.split(',');
    boxes.filter((b) => b.getAttribute('data-facet') === key && values.includes(b.value))
      .forEach((b) => (b.checked = true));
  });
  if (minInput && params.get('min')) minInput.value = params.get('min')!;
  if (maxInput && params.get('max')) maxInput.value = params.get('max')!;
  if (searchInput && params.get('q')) searchInput.value = params.get('q')!;
  if (sortSelect && params.get('sort')) sortSelect.value = params.get('sort')!;
  sortProducts();
  apply();
}
document.querySelectorAll<HTMLElement>('[data-catalog]').forEach(initCatalog);

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
