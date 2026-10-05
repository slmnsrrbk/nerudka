// Интерактив итоговой главной: меню, модалки, формы, корзина, прайс, калькулятор, слайдеры, поиск.

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const fmt = (n: number, d = 0) => n.toLocaleString('ru-RU', { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/ /g, ' ');
const rub = (n: number) => `${fmt(Math.round(n))} ₽`;
const vol = (n: number) => `${fmt(n, n % 1 ? 1 : 0)} м³`;
const mq = (q: string) => window.matchMedia(q).matches;

/* ---------- Блокировка прокрутки и фокус ---------- */
let locks = 0;
const lock = (on: boolean) => {
  locks = Math.max(0, locks + (on ? 1 : -1));
  document.body.classList.toggle('lock', locks > 0);
};

/* ---------- Уведомление ---------- */
let toastTimer = 0;
function toast(text: string) {
  const t = $('[data-toast]');
  if (!t) return;
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t.hidden = true), 2600);
}

/* ---------- Оверлеи (заявка, поиск, корзина) ---------- */
const opened: { el: HTMLElement; back: Element | null }[] = [];
function openOverlay(name: string) {
  const el = $(`[data-overlay="${name}"]`);
  if (!el || !el.hidden) return el;
  closeMega();
  el.hidden = false;
  lock(true);
  opened.push({ el, back: document.activeElement });
  requestAnimationFrame(() => $<HTMLElement>('input:not([type=hidden]):not([type=checkbox]), button', el)?.focus());
  return el;
}
function closeOverlay(el?: HTMLElement | null) {
  const item = el ? opened.find((o) => o.el === el) : opened[opened.length - 1];
  if (!item) return;
  item.el.hidden = true;
  opened.splice(opened.indexOf(item), 1);
  lock(false);
  (item.back as HTMLElement | null)?.focus?.();
}
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const ov = t.closest<HTMLElement>('.ov');
  if (ov && (t === ov || t.closest('[data-close]'))) closeOverlay(ov);
});

function openLead(topic: string, comment = '') {
  const el = openOverlay('lead');
  if (!el) return;
  const form = $<HTMLFormElement>('form', el)!;
  const done = $('[data-done]', el)!;
  form.hidden = false;
  done.hidden = true;
  $('[data-lead-topic]', el)!.textContent = topic || 'Заявка';
  $<HTMLInputElement>('[data-lead-topic-input]', el)!.value = topic;
  $<HTMLTextAreaElement>('[data-lead-comment]', el)!.value = comment;
}
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('[data-modal="lead"]');
  if (!b) return;
  e.preventDefault();
  closeDrawer();
  let comment = '';
  if (b.hasAttribute('data-calc-order')) comment = calcSummary();
  openLead(b.dataset.topic || 'Заявка', comment);
});

/* ---------- Формы: маска телефона, проверка, успех ---------- */
function maskPhone(input: HTMLInputElement) {
  let d = input.value.replace(/\D/g, '');
  if (!d) { input.value = ''; return; }
  if (d[0] === '8') d = '7' + d.slice(1);
  if (d[0] !== '7') d = '7' + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  let v = '+7';
  if (p[0]) v += ` (${p[0]}`;
  if (p[0].length === 3) v += ')';
  if (p[1]) v += ` ${p[1]}`;
  if (p[2]) v += `-${p[2]}`;
  if (p[3]) v += `-${p[3]}`;
  input.value = v;
}
document.addEventListener('input', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.matches('[data-phone]')) maskPhone(t);
  if (t.classList.contains('err')) t.classList.remove('err');
});
document.addEventListener('focusout', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.matches?.('[data-phone]') && t.value.replace(/\D/g, '').length <= 1) t.value = '';
});
document.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.name === 'consent') t.closest('.consent')?.classList.remove('err');
});

function validate(form: HTMLFormElement): boolean {
  const errs: string[] = [];
  const name = form.elements.namedItem('name') as HTMLInputElement | null;
  const phone = form.elements.namedItem('phone') as HTMLInputElement | null;
  const consent = form.elements.namedItem('consent') as HTMLInputElement | null;
  if (name && name.value.trim().length < 2) { name.classList.add('err'); errs.push('укажите имя'); }
  if (phone && phone.value.replace(/\D/g, '').length !== 11) { phone.classList.add('err'); errs.push('проверьте телефон'); }
  if (consent && !consent.checked) { consent.closest('.consent')?.classList.add('err'); errs.push('отметьте согласие на обработку персональных данных'); }
  const box = $('[data-form-err]', form);
  if (box) { box.hidden = !errs.length; box.textContent = errs.length ? `Чтобы отправить, ${errs.join(', ')}.` : ''; }
  if (errs.length) form.querySelector<HTMLElement>('.err input, input.err')?.focus();
  return !errs.length;
}
document.addEventListener('submit', (e) => {
  const form = e.target as HTMLFormElement;
  if (!form.matches('[data-form]')) return;
  e.preventDefault();
  if (!validate(form)) return;
  if (form.matches('[data-hero-form]')) {
    const el = openOverlay('lead');
    if (el) { $('form', el)!.hidden = true; $('[data-done]', el)!.hidden = false; }
    form.reset();
    return;
  }
  const host = form.closest('.ov-card, .side-body')!;
  form.hidden = true;
  $('[data-done]', host)!.hidden = false;
  form.reset();
  if (form.matches('[data-cart-form]')) { cart = {}; saveCart(); renderCart(true); }
});

/* ---------- Корзина ---------- */
type Item = { name: string; price: number; href: string; qty: number };
let cart: Record<string, Item> = {};
try { cart = JSON.parse(localStorage.getItem('beton-cart') || '{}'); } catch { cart = {}; }
function saveCart() {
  try { localStorage.setItem('beton-cart', JSON.stringify(cart)); } catch { /* приватный режим */ }
  const n = Object.keys(cart).length;
  $$('[data-cart-count]').forEach((b) => (b.textContent = String(n)));
}
const DISC = [{ from: 500, p: 20 }, { from: 200, p: 15 }, { from: 50, p: 10 }];
function renderCart(keepDone = false) {
  const el = $('[data-overlay="cart"]');
  if (!el) return;
  const items = Object.entries(cart);
  const list = $('[data-cart-list]', el)!;
  list.innerHTML = '';
  for (const [id, it] of items) {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `<div><a href="${it.href}"></a><div class="ci-p">${rub(it.price)} за м³</div></div><b class="ci-sum">${rub(it.price * it.qty)}</b>
      <div class="ci-ctl"><div class="stepper"><button type="button" class="st-b" data-cdec aria-label="Меньше">−</button><input class="st-q" value="${it.qty}" inputmode="decimal" data-cqty aria-label="Объём, м³"><button type="button" class="st-b" data-cinc aria-label="Больше">+</button></div>
      <button type="button" class="ci-del" data-cdel>Удалить</button></div>`;
    li.dataset.id = id;
    $('a', li)!.textContent = it.name;
    list.appendChild(li);
  }
  const volume = items.reduce((s, [, it]) => s + it.qty, 0);
  const subtotal = items.reduce((s, [, it]) => s + it.qty * it.price, 0);
  const d = DISC.find((x) => volume >= x.from);
  const disc = d ? subtotal * d.p / 100 : 0;
  $('[data-cart-empty]', el)!.hidden = items.length > 0;
  $('[data-cart-sum]', el)!.hidden = !items.length;
  const form = $<HTMLFormElement>('[data-cart-form]', el)!;
  const done = $('[data-done]', el)!;
  if (!keepDone) { done.hidden = true; }
  form.hidden = !items.length || !done.hidden;
  $('[data-cart-vol]', el)!.textContent = vol(volume);
  $('[data-cart-subtotal]', el)!.textContent = rub(subtotal);
  $('[data-cart-disc-row]', el)!.hidden = !d;
  $('[data-cart-disc-label]', el)!.textContent = d ? `Скидка ${d.p} % от объёма` : 'Скидка';
  $('[data-cart-disc]', el)!.textContent = `−${rub(disc)}`;
  $('[data-cart-total]', el)!.textContent = rub(subtotal - disc);
  const next = [...DISC].reverse().find((x) => volume < x.from);
  $('[data-cart-hint]', el)!.textContent = next
    ? `До скидки ${next.p} % осталось ${vol(next.from - volume)}. Доставку посчитает диспетчер по адресу.`
    : 'Максимальная скидка учтена. Доставку посчитает диспетчер по адресу.';
}
function setQty(id: string, q: number) {
  if (!cart[id]) return;
  if (q <= 0) delete cart[id]; else cart[id].qty = q;
  saveCart();
  renderCart();
}
const clampQ = (v: number) => Math.min(9999, Math.max(0.5, Math.round(v * 2) / 2));
const readQ = (input: HTMLInputElement) => clampQ(parseFloat(input.value.replace(',', '.')) || 1);

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-cart-open]')) { e.preventDefault(); closeDrawer(); renderCart(); openOverlay('cart'); return; }
  const li = t.closest<HTMLElement>('.cart-item');
  if (li) {
    const id = li.dataset.id!;
    if (t.closest('[data-cdel]')) setQty(id, 0);
    else if (t.closest('[data-cinc]')) setQty(id, cart[id].qty + 1);
    else if (t.closest('[data-cdec]')) setQty(id, cart[id].qty - 1 < 0.5 ? 0.5 : cart[id].qty - 1);
  }
});
document.addEventListener('change', (e) => {
  const t = e.target as HTMLInputElement;
  if (t.matches('[data-cqty]')) setQty(t.closest<HTMLElement>('.cart-item')!.dataset.id!, readQ(t));
});

/* ---------- Прайс: вкладки, счётчики, заказ ---------- */
const price = $('[data-price]');
if (price) {
  price.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const tab = t.closest<HTMLElement>('[data-price-tab]');
    if (tab) {
      const slug = tab.dataset.priceTab!;
      $$('[data-price-tab]', price).forEach((b) => { const on = b === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      $$('[data-price-pane]', price).forEach((p) => (p.hidden = p.dataset.pricePane !== slug));
      tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      if (mq('(max-width: 1080px)')) $('.price-panel', price)!.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }
    const cell = t.closest<HTMLElement>('.pcell[data-item]');
    if (!cell) return;
    const input = $<HTMLInputElement>('[data-qty]', cell)!;
    let q = readQ(input);
    if (t.closest('[data-inc]')) { q = clampQ(q + 1); input.value = fmt(q, q % 1 ? 1 : 0); }
    if (t.closest('[data-dec]')) { q = clampQ(q - 1); input.value = fmt(q, q % 1 ? 1 : 0); }
    const { item: id, name, href } = cell.dataset as { item: string; name: string; href: string };
    const p = Number(cell.dataset.price);
    if (t.closest('[data-add]')) {
      cart[id] = { name, price: p, href, qty: (cart[id]?.qty ?? 0) + q };
      saveCart();
      const btn = $('[data-add]', cell)!;
      btn.classList.add('added');
      setTimeout(() => btn.classList.remove('added'), 900);
      toast(`В корзине: ${name}, ${vol(cart[id].qty)}`);
    }
    if (t.closest('[data-order]')) openLead(`Заказ: ${name}`, `${name}, ${vol(q)} по ${rub(p)} за м³`);
  });
  price.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.matches('[data-qty]')) { const q = readQ(t); t.value = fmt(q, q % 1 ? 1 : 0); }
  });
}

/* ---------- Мегаменю ---------- */
const mega = $('[data-mega]');
const megaBack = $('[data-mega-backdrop]');
let megaTimer = 0;
let megaTrigger: HTMLElement | null = null;
let megaOpenedAt = 0;
function openMega(trigger: HTMLElement) {
  if (!mega || mq('(max-width: 1080px)')) return;
  clearTimeout(megaTimer);
  if (mega.hidden || megaTrigger !== trigger) megaOpenedAt = Date.now();
  megaTrigger = trigger;
  const nav = trigger.closest('.nav')!.getBoundingClientRect();
  mega.style.top = `${Math.max(12, nav.bottom + 14)}px`;
  // Затемнение начинается под шапкой, чтобы курсор на пункте «Продукция» не попадал на него и не закрывал меню.
  megaBack!.style.top = `${Math.max(0, nav.bottom + 6)}px`;
  mega.hidden = false;
  megaBack!.hidden = false;
  $$('[data-mega-toggle]').forEach((b) => b.setAttribute('aria-expanded', String(b === trigger)));
}
function closeMega() {
  if (!mega || mega.hidden) return;
  mega.hidden = true;
  megaBack!.hidden = true;
  $$('[data-mega-toggle]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
}
function setMegaTab(id: string) {
  $$('[data-mega-tab]').forEach((b) => { const on = b.dataset.megaTab === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
  $$('[data-mega-pane]').forEach((p) => (p.hidden = p.dataset.megaPane !== id));
}
if (mega) {
  $$('[data-mega-toggle]').forEach((b) => {
    // Наведение уже могло открыть меню — клик сразу после него не должен его закрыть.
    b.addEventListener('click', () => (mega.hidden || megaTrigger !== b ? openMega(b) : Date.now() - megaOpenedAt > 500 && closeMega()));
    b.addEventListener('mouseenter', () => { if (mq('(hover: hover)')) megaTimer = window.setTimeout(() => openMega(b), 120); });
    b.addEventListener('mouseleave', () => clearTimeout(megaTimer));
    b.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); openMega(b); $<HTMLElement>('[data-mega-tab].on', mega)?.focus(); } });
  });
  $$('[data-mega-tab]').forEach((b) => {
    b.addEventListener('mouseenter', () => setMegaTab(b.dataset.megaTab!));
    b.addEventListener('click', () => setMegaTab(b.dataset.megaTab!));
    b.addEventListener('focus', () => setMegaTab(b.dataset.megaTab!));
  });
  megaBack!.addEventListener('click', closeMega);
  megaBack!.addEventListener('mouseenter', () => { if (mq('(hover: hover)')) megaTimer = window.setTimeout(closeMega, 250); });
  mega.addEventListener('mouseenter', () => clearTimeout(megaTimer));
  mega.addEventListener('click', (e) => { if ((e.target as HTMLElement).closest('a')) closeMega(); });
  window.addEventListener('resize', () => { if (mq('(max-width: 1080px)')) closeMega(); });
}

/* ---------- Мобильное меню ---------- */
const drawer = $('[data-drawer]');
function closeDrawer() {
  if (!drawer || drawer.hidden) return;
  drawer.hidden = true;
  lock(false);
}
document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('[data-drawer-open]') && drawer) { drawer.hidden = false; lock(true); $<HTMLElement>('[data-drawer-close]', drawer)?.focus(); return; }
  if (t.closest('[data-drawer-close]') || (drawer && !drawer.hidden && t.closest('.drawer a[href^="#"], .drawer a[href^="/"]'))) closeDrawer();
});

/* ---------- Esc ---------- */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (opened.length) closeOverlay();
  else if (mega && !mega.hidden) { closeMega(); megaTrigger?.focus(); }
  else closeDrawer();
});

/* ---------- Липкая шапка ---------- */
const hero = $('[data-hero]');
const sticky = $('[data-sticky]');
if (hero && sticky) {
  new IntersectionObserver(([en]) => {
    const on = !en.isIntersecting;
    sticky.classList.toggle('on', on);
    sticky.setAttribute('aria-hidden', String(!on));
    if (!on && megaTrigger?.closest('.sticky-bar')) closeMega();
  }, { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
}

/* ---------- Поиск ---------- */
type SItem = { t: string; h: string; k: string; p: number };
let sIndex: SItem[] = [];
try { sIndex = JSON.parse($('#search-data')?.textContent || '[]'); } catch { sIndex = []; }
const sNorm = (s: string) => s.toLowerCase().replace(/ё/g, 'е').replace(/,/g, '.')
  .replace(/(^|[^a-zа-я])m(?=\d)/g, '$1м').replace(/(^|[^a-zа-я])[bв](?=\d)/g, '$1в');
const sPrepared = sIndex.map((x) => ({ ...x, n: sNorm(`${x.t} ${x.k}`) }));
const sEl = $('[data-overlay="search"]');
const sInput = $<HTMLInputElement>('[data-search-input]');
const sRes = $('[data-search-res]');
function esc(s: string) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!)); }
function runSearch() {
  if (!sInput || !sRes) return;
  const q = sNorm(sInput.value.trim());
  $('[data-search-hints]')!.hidden = !!q;
  if (!q) { sRes.innerHTML = ''; return; }
  const words = q.split(/\s+/).filter(Boolean);
  const found = sPrepared.filter((x) => words.every((w) => x.n.includes(w)))
    .sort((a, b) => (a.k === 'Раздел' ? -1 : 0) - (b.k === 'Раздел' ? -1 : 0) || a.p - b.p).slice(0, 30);
  if (!found.length) { sRes.innerHTML = '<li class="search-empty">Ничего не нашли. Позвоните — подберём состав: +7 (495) 000-00-00</li>'; return; }
  sRes.innerHTML = found.map((x, i) => `<li><a href="${x.h}" class="${i === 0 ? 'on' : ''}"><span class="r-t"><span>${esc(x.t)}</span><span class="r-k">${esc(x.k)}</span></span><span class="r-p">${x.k === 'Раздел' ? 'от ' : ''}${rub(x.p)}</span></a></li>`).join('');
}
if (sEl && sInput) {
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-search-open]')) { closeDrawer(); openOverlay('search'); sInput.focus(); runSearch(); }
    const hint = (e.target as HTMLElement).closest<HTMLElement>('[data-q]');
    if (hint) { sInput.value = hint.dataset.q!; runSearch(); sInput.focus(); }
  });
  sInput.addEventListener('input', runSearch);
  sInput.addEventListener('keydown', (e) => {
    const links = $$<HTMLAnchorElement>('a', sRes!);
    const i = links.findIndex((a) => a.classList.contains('on'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = links[(i + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length];
      links.forEach((a) => a.classList.toggle('on', a === n));
      n?.scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter' && links[i]) { e.preventDefault(); location.href = links[i].href; }
  });
}

/* ---------- Слайдеры фото на карточках РБУ ---------- */
$$('[data-slider]').forEach((sl) => {
  const track = $('[data-track]', sl)!;
  const dots = $$('[data-dots] button', sl);
  const cur = $('[data-cur]', sl)!;
  const n = track.children.length;
  const idx = () => Math.round(track.scrollLeft / track.clientWidth);
  const go = (i: number) => track.scrollTo({ left: ((i + n) % n) * track.clientWidth, behavior: 'smooth' });
  $('[data-prev]', sl)?.addEventListener('click', () => go(idx() - 1));
  $('[data-next]', sl)?.addEventListener('click', () => go(idx() + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  let raf = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { const i = idx(); cur.textContent = String(i + 1); dots.forEach((d, k) => d.classList.toggle('on', k === i)); });
  }, { passive: true });
});

/* ---------- Карусель объектов ---------- */
$$('[data-carousel]').forEach((car) => {
  const track = $('[data-track]', car)!;
  const prev = $<HTMLButtonElement>('[data-prev]', car)!;
  const next = $<HTMLButtonElement>('[data-next]', car)!;
  const dotsBox = $('[data-dots]', car)!;
  const step = () => (track.children[0] as HTMLElement).offsetWidth + parseFloat(getComputedStyle(track).columnGap || '20');
  const pages = () => Math.max(1, Math.round((track.scrollWidth - track.clientWidth) / step()) + 1);
  function build() {
    dotsBox.innerHTML = '';
    for (let i = 0; i < pages(); i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Объекты, страница ${i + 1}`);
      b.addEventListener('click', () => track.scrollTo({ left: i * step() }));
      dotsBox.appendChild(b);
    }
    sync();
  }
  function sync() {
    const i = Math.round(track.scrollLeft / step());
    $$('button', dotsBox).forEach((b, k) => b.classList.toggle('on', k === i));
    prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 4;
  }
  prev.addEventListener('click', () => track.scrollBy({ left: -step() }));
  next.addEventListener('click', () => track.scrollBy({ left: step() }));
  track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  window.addEventListener('resize', build);
  build();
});

/* ---------- SEO: «Читать полностью» ---------- */
$$('[data-seo]').forEach((s) => {
  const btn = $('[data-seo-toggle]', s)!;
  btn.addEventListener('click', () => {
    const open = s.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    $('span', btn)!.textContent = open ? 'Свернуть' : 'Читать полностью';
    if (!open) s.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
});

/* ---------- Калькулятор объёма ---------- */
type Field = { k: string; label: string; v: number; step: number };
type Calc = { name: string; fields: Field[]; volume: (f: Record<string, number>) => number; grade: string; svg: (f: Record<string, number>) => string };
const n1 = (v: number) => fmt(v, v % 1 ? (v < 1 ? 2 : 1) : 0);
const CALCS: Calc[] = [
  {
    name: 'Лента',
    fields: [{ k: 'l', label: 'Общая длина ленты, м', v: 48, step: 1 }, { k: 'w', label: 'Ширина, м', v: 0.4, step: 0.05 }, { k: 'h', label: 'Высота, м', v: 1.2, step: 0.1 }],
    volume: (f) => f.l * f.w * f.h,
    grade: 'Марка для ленточного фундамента — обычно М250 В20',
    svg: (f) => `<svg viewBox="0 0 360 260"><rect x="50" y="70" width="260" height="150" rx="6" fill="none" stroke="#DCE3EE" stroke-width="22"/><rect x="39" y="59" width="282" height="172" rx="8" fill="none" stroke="#1C2438" stroke-width="1.5"/><rect x="61" y="81" width="238" height="128" rx="4" fill="none" stroke="#1C2438" stroke-width="1.5"/><text x="180" y="150" text-anchor="middle" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">длина ${n1(f.l)} м</text><text x="180" y="252" text-anchor="middle" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">ширина ${n1(f.w)} м · высота ${n1(f.h)} м</text></svg>`,
  },
  {
    name: 'Плита',
    fields: [{ k: 'l', label: 'Длина, м', v: 16, step: 0.5 }, { k: 'w', label: 'Ширина, м', v: 12, step: 0.5 }, { k: 'h', label: 'Толщина, м', v: 0.3, step: 0.05 }],
    volume: (f) => f.l * f.w * f.h,
    grade: 'Марка для плиты под дом — М300 В22,5',
    svg: (f) => `<svg viewBox="0 0 360 260"><rect x="50" y="110" width="260" height="110" rx="6" fill="#DCE3EE" stroke="#1C2438" stroke-width="1.5"/><text x="180" y="245" text-anchor="middle" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">${n1(f.l)} м</text><text x="318" y="169" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">${n1(f.w)} м</text><text x="24" y="169" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">${n1(f.h)} м</text></svg>`,
  },
  {
    name: 'Стяжка',
    fields: [{ k: 's', label: 'Площадь пола, м²', v: 60, step: 1 }, { k: 't', label: 'Толщина, см', v: 5, step: 0.5 }],
    volume: (f) => f.s * f.t / 100,
    grade: 'Марка для стяжки — обычно М200 В15',
    svg: (f) => `<svg viewBox="0 0 360 260"><path d="M60 170 180 110 300 170 180 230Z" fill="#DCE3EE" stroke="#1C2438" stroke-width="1.5"/><path d="M60 170v-14l120-60 120 60v14" fill="none" stroke="#1C2438" stroke-width="1.5"/><text x="180" y="175" text-anchor="middle" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">${n1(f.s)} м²</text><text x="180" y="80" text-anchor="middle" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">толщина ${n1(f.t)} см</text></svg>`,
  },
  {
    name: 'Столбы и сваи',
    fields: [{ k: 'n', label: 'Количество, шт.', v: 12, step: 1 }, { k: 'd', label: 'Диаметр, м', v: 0.3, step: 0.05 }, { k: 'h', label: 'Глубина, м', v: 2, step: 0.1 }],
    volume: (f) => f.n * Math.PI * (f.d / 2) ** 2 * f.h,
    grade: 'Марку для свай и столбов подскажет технолог по проекту и грунтам',
    svg: (f) => `<svg viewBox="0 0 360 260">${[90, 150, 210, 270].map((x) => `<rect x="${x - 14}" y="90" width="28" height="130" rx="4" fill="#DCE3EE" stroke="#1C2438" stroke-width="1.5"/><ellipse cx="${x}" cy="90" rx="14" ry="5" fill="#fff" stroke="#1C2438" stroke-width="1.5"/>`).join('')}<text x="180" y="70" text-anchor="middle" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">${n1(f.n)} шт. · ⌀ ${n1(f.d)} м</text><text x="180" y="245" text-anchor="middle" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">глубина ${n1(f.h)} м</text></svg>`,
  },
  {
    name: 'Отмостка',
    fields: [{ k: 'p', label: 'Периметр дома, м', v: 40, step: 1 }, { k: 'w', label: 'Ширина, м', v: 1, step: 0.1 }, { k: 'h', label: 'Толщина, м', v: 0.1, step: 0.05 }],
    volume: (f) => f.p * f.w * f.h,
    grade: 'Марка для отмостки — обычно М200 В15',
    svg: (f) => `<svg viewBox="0 0 360 260"><rect x="80" y="80" width="200" height="140" rx="6" fill="#DCE3EE" stroke="#1C2438" stroke-width="1.5"/><rect x="106" y="106" width="148" height="88" rx="4" fill="#fff" stroke="#1C2438" stroke-width="1.5"/><text x="180" y="155" text-anchor="middle" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">дом</text><text x="180" y="245" text-anchor="middle" font-family="Onest, sans-serif" font-size="13" font-weight="500" fill="#6B7593">периметр ${n1(f.p)} м · ширина ${n1(f.w)} м</text></svg>`,
  },
];
const calc = $('[data-calc]');
let calcType = 1;
const calcVals: Record<number, Record<string, number>> = {};
function calcRender() {
  if (!calc) return;
  const c = CALCS[calcType];
  const vals = (calcVals[calcType] ||= Object.fromEntries(c.fields.map((f) => [f.k, f.v])));
  $('[data-calc-fields]', calc)!.innerHTML = c.fields.map((f) => `<label class="fld"><span>${f.label}</span><input type="number" inputmode="decimal" min="0" step="${f.step}" value="${vals[f.k]}" data-k="${f.k}"></label>`).join('');
  calcUpdate();
}
function calcUpdate() {
  if (!calc) return;
  const c = CALCS[calcType];
  const vals = calcVals[calcType];
  $$<HTMLInputElement>('[data-k]', calc).forEach((i) => { const v = parseFloat(i.value.replace(',', '.')); vals[i.dataset.k!] = Number.isFinite(v) && v >= 0 ? v : 0; });
  const v = c.volume(vals);
  $('[data-calc-v]', calc)!.textContent = `${n1(Math.round(v * 10) / 10 || Math.round(v * 100) / 100)} м³`;
  $('[data-calc-s]', calc)!.textContent = `С запасом 5 % — ${n1(Math.round(v * 1.05 * 10) / 10)} м³`;
  $('[data-calc-grade]', calc)!.textContent = c.grade;
  $('[data-calc-fig]', calc)!.innerHTML = c.svg(vals);
  $('[data-calc-cap]', calc)!.textContent = `Схема: ${c.name.toLowerCase()}`;
}
function calcSummary() {
  const c = CALCS[calcType];
  const v = c.volume(calcVals[calcType] || {});
  return `Калькулятор: ${c.name.toLowerCase()}, ${c.fields.map((f) => `${f.label.toLowerCase()} ${n1(calcVals[calcType][f.k])}`).join(', ')}. Объём ${n1(Math.round(v * 10) / 10)} м³, с запасом 5 % — ${n1(Math.round(v * 1.05 * 10) / 10)} м³.`;
}
if (calc) {
  $$('[data-calc-type]', calc).forEach((b) => b.addEventListener('click', () => {
    calcType = Number(b.dataset.calcType);
    $$('[data-calc-type]', calc).forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); });
    calcRender();
  }));
  calc.addEventListener('input', (e) => { if ((e.target as HTMLElement).matches('[data-k]')) calcUpdate(); });
  calcRender();
}

saveCart();

/* ---------- Выбор марки в форме первого экрана: текст поля + «▾» как в макете ---------- */
$$<HTMLSelectElement>('[data-sel]').forEach((sel) => {
  const v = sel.parentElement!.querySelector('[data-sel-v]')!;
  const sync = () => (v.textContent = sel.value);
  sel.addEventListener('change', sync);
  sync();
});
