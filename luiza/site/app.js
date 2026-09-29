// Заполняет шаблон данными поста (window.CASE, те же имена, что у полей потока)
// и включает поведение страницы: аккордеон, плитку фото, просмотр фото, курсор, меню.
(() => {
  const data = window.CASE || {};
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), data);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- Привязка полей. Пустое поле прячет свой элемент, как видимость «Указано».
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const key = el.dataset.bind;
    const val = get(key);
    const holder = el.closest('[data-field]') || el;
    if (val == null || val === '' || (Array.isArray(val) && !val.length)) { holder.hidden = true; return; }

    if (el.tagName === 'IMG') {
      el.src = val;
      el.alt = data.title || '';
      if (!holder.closest('.hero')) el.loading = 'lazy';
    } else if (key === 'gallery') {
      el.innerHTML = layoutTiles(val);
    } else if ('list' in el.dataset) {
      el.innerHTML = String(val).split('\n').map((s) => s.trim()).filter(Boolean).map((s) => `<li>${esc(s)}</li>`).join('');
    } else {
      el.textContent = val;
    }
  });
  if (!data.next || !data.next.title) document.querySelector('[data-section="next"]').hidden = true;

  // ---------- Плитка фото разных размеров.
  // Сетка из 12 колонок, фото раскладываются рядами по шаблонам. Горизонтальные фото
  // идут в широкие ячейки, вертикальные в узкие. Ряды всегда закрываются целиком.
  function layoutTiles(list) {
    const wide = list.filter((g) => g.w > g.h);
    const tall = list.filter((g) => g.w <= g.h);
    // Каждый шаблон: список ячеек [ориентация, колонки]. Высота ряда задаётся классом.
    const ROWS = [
      { cls: 'r-a', cells: [['w', 8], ['t', 4]] },
      { cls: 'r-b', cells: [['t', 4], ['t', 4], ['t', 4]] },
      { cls: 'r-a', cells: [['t', 4], ['w', 8]] },
      { cls: 'r-c', cells: [['t', 3], ['t', 3], ['t', 3], ['t', 3]] },
      { cls: 'r-d', cells: [['w', 6], ['w', 6]] },
      { cls: 'r-b', cells: [['t', 5], ['t', 7]] },
    ];
    const out = [];
    let i = 0, guard = 0;
    while ((wide.length || tall.length) && guard++ < 100) {
      const row = ROWS[i++ % ROWS.length];
      const needW = row.cells.filter((c) => c[0] === 'w').length;
      const needT = row.cells.length - needW;
      if (needW > wide.length || needT > tall.length) {
        // Шаблон не заполнить: если фото осталось мало, делим ряд поровну между ними.
        if (!ROWS.some((r) => fits(r, wide, tall))) {
          const rest = [...wide.splice(0), ...tall.splice(0)];
          const span = Math.floor(12 / rest.length) || 12;
          out.push(`<div class="tiles__row r-b">${rest.map((g) => cell(g, span)).join('')}</div>`);
        }
        continue;
      }
      out.push(`<div class="tiles__row ${row.cls}">${row.cells.map(([o, span]) => cell((o === 'w' ? wide : tall).shift(), span)).join('')}</div>`);
    }
    return out.join('');
  }
  function fits(r, wide, tall) {
    const w = r.cells.filter((c) => c[0] === 'w').length;
    return w <= wide.length && r.cells.length - w <= tall.length;
  }
  function cell(g, span) {
    return `<figure class="tile${g.w > g.h ? ' tile--wide' : ''}" style="--span:${span}" data-view><img src="${esc(g.src)}" width="${g.w}" height="${g.h}" loading="lazy" alt=""></figure>`;
  }

  // ---------- Аккордеон «О проекте». Открыт один пункт, справа фото этого пункта.
  const accItems = [...document.querySelectorAll('.acc__item')].filter((it) => !it.hidden);
  const aboutImg = document.querySelector('.about__photo img');
  function openItem(item) {
    accItems.forEach((it) => {
      const on = it === item && !it.classList.contains('is-open');
      it.classList.toggle('is-open', on);
      it.querySelector('.acc__head').setAttribute('aria-expanded', on);
    });
    const src = get((item.classList.contains('is-open') ? item : accItems[0]).dataset.photo);
    if (src && aboutImg.getAttribute('src') !== src) {
      aboutImg.classList.add('is-fading');
      const next = new Image();
      next.onload = next.onerror = () => { aboutImg.src = src; aboutImg.classList.remove('is-fading'); };
      next.src = src;
    }
  }
  accItems.forEach((it) => it.querySelector('.acc__head').addEventListener('click', () => openItem(it)));
  const first = accItems.find((it) => it.classList.contains('is-open')) || accItems[0];
  if (first) { aboutImg.src = get(first.dataset.photo) || ''; aboutImg.alt = data.title || ''; }

  // ---------- Буквы меню для анимации .txt2 .letter
  document.querySelectorAll('.txt2').forEach((a) => {
    a.innerHTML = [...a.textContent].map((c) => `<span class="letter" data-l="${c === ' ' ? ' ' : c}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  });

  // ---------- Появление плиток с лёгким увеличением
  const io = 'IntersectionObserver' in window && new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.tile, .about__photo, .next__card').forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));

  // ---------- Курсор: белая точка, над фото растёт и показывает «Смотреть»
  const cursor = document.querySelector('.cursor');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let x = -100, y = -100, cx = x, cy = y;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });
    (function loop() {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', (e) => {
      cursor.classList.toggle('is-view', !!e.target.closest('[data-view]') && lb.hidden);
    });
  }

  // ---------- Просмотр фото на весь экран: стрелки, клавиатура, свайп, счётчик
  const lb = document.querySelector('.lb');
  const lbImg = lb.querySelector('.lb__img');
  const lbCount = lb.querySelector('.lb__count');
  let photos = [];
  let cur = 0;
  let lastFocus = null;

  const collect = () => [...document.querySelectorAll('.hero__media img, .about__photo img, .tile img')]
    .filter((im) => im.getAttribute('src'))
    .map((im) => im.getAttribute('src'))
    .filter((src, i, arr) => arr.indexOf(src) === i);

  function show(i) {
    cur = (i + photos.length) % photos.length;
    lbImg.classList.add('is-fading');
    const src = photos[cur];
    const im = new Image();
    im.onload = im.onerror = () => { lbImg.src = src; lbImg.classList.remove('is-fading'); };
    im.src = src;
    lbCount.textContent = `${cur + 1} / ${photos.length}`;
    [cur + 1, cur - 1].forEach((j) => { new Image().src = photos[(j + photos.length) % photos.length]; });
  }
  function open(src) {
    photos = collect();
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.documentElement.classList.add('lb-open');
    cursor.classList.remove('is-view');
    requestAnimationFrame(() => lb.classList.add('is-on'));
    show(Math.max(0, photos.indexOf(src)));
    lb.querySelector('.lb__close').focus();
  }
  function close() {
    lb.classList.remove('is-on');
    document.documentElement.classList.remove('lb-open');
    setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); }, 250);
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener('click', (e) => {
    const fig = e.target.closest('.hero__media, .about__photo, .tile');
    if (!fig) return;
    const img = fig.querySelector('img');
    if (img && img.getAttribute('src')) open(img.getAttribute('src'));
  });
  lb.querySelector('.lb__close').addEventListener('click', close);
  lb.querySelector('.lb__prev').addEventListener('click', () => show(cur - 1));
  lb.querySelector('.lb__next').addEventListener('click', () => show(cur + 1));
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb__stage')) close(); });
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(cur + 1);
    if (e.key === 'ArrowLeft') show(cur - 1);
  });
  let sx = null, sy = null;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
    else if (dy > 90) close();
    sx = sy = null;
  });

  // ---------- Шапка: фон появляется после прокрутки первого экрана
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
