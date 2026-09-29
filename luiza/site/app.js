// Заполняет шаблон данными одного поста (window.CASE, те же имена, что у полей потока)
// и включает эффекты сайта: курсор, буквы в меню, появление при прокрутке.
(() => {
  const data = window.CASE || {};
  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), data);

  // Привязка полей. Пустое поле прячет свой элемент, как видимость «Указано» в Тильде.
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const key = el.dataset.bind;
    const val = get(key);
    const holder = el.closest('[data-field]') || el;
    const empty = val == null || val === '' || (Array.isArray(val) && !val.length);
    if (empty) { holder.hidden = true; return; }

    if (el.tagName === 'IMG') {
      el.src = val;
      el.loading = holder.closest('.hero') ? 'eager' : 'lazy';
      el.alt = data.title || '';
    } else if (key === 'gallery') {
      el.innerHTML = val.map((g) => `<figure class="ph reveal${g.w > g.h ? ' is-wide' : ''}" data-view><img src="${g.src}" width="${g.w}" height="${g.h}" loading="lazy" alt=""></figure>`).join('');
    } else if ('list' in el.dataset) {
      el.innerHTML = String(val).split('\n').map((s) => s.trim()).filter(Boolean).map((s) => `<li>${s}</li>`).join('');
    } else {
      el.textContent = val;
    }
  });

  // Раздел без текста и без фото целиком не нужен.
  document.querySelectorAll('[data-section]').forEach((sec) => {
    const fields = sec.querySelectorAll('[data-field]');
    if (fields.length && [...fields].every((f) => f.hidden)) sec.hidden = true;
  });
  if (!data.next || !data.next.title) document.querySelector('[data-section="next"]').hidden = true;

  // Буквы меню для анимации .txt2 .letter
  document.querySelectorAll('.txt2').forEach((a) => {
    a.innerHTML = [...a.textContent].map((c) => `<span class="letter" data-l="${c === ' ' ? ' ' : c}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  });

  // Появление с увеличением
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Курсор: белая точка, над фото растёт и показывает «Смотреть»
  const cursor = document.querySelector('.cursor');
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });
    (function loop() {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', (e) => cursor.classList.toggle('is-view', !!e.target.closest('[data-view]')));
  }

  // Лайтбокс для фото
  const box = document.querySelector('.lightbox');
  document.addEventListener('click', (e) => {
    const fig = e.target.closest('figure[data-view], .hero__media, .wide');
    if (!fig || document.body.classList.contains('show-fields')) return;
    const img = fig.querySelector('img');
    if (!img || !img.src) return;
    box.querySelector('img').src = img.src;
    box.hidden = false;
  });
  box.addEventListener('click', () => { box.hidden = true; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') box.hidden = true; });

  // Переключатель подписей полей CMS
  const toggle = document.querySelector('.fields-toggle');
  toggle.addEventListener('click', () => {
    const on = document.body.classList.toggle('show-fields');
    toggle.setAttribute('aria-pressed', on);
  });
})();
