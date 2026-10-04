(function () {
  'use strict';

  var deck = document.getElementById('deck');
  var slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));
  var bar = document.querySelector('.progress__bar');
  var dotsList = document.querySelector('.dots__list');
  var cover = document.querySelector('.slide--cover');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobile = window.matchMedia('(max-width: 767px)');
  var current = 0;

  function behavior() {
    return reduceMotion.matches ? 'auto' : 'smooth';
  }

  function goTo(index) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    deck.scrollTo({ top: slides[index].offsetTop, behavior: behavior() });
  }

  function pad(n) {
    return ('00' + n).slice(-3);
  }

  /* ---------- Якорные метки: номер слайда, линия, кресты ---------- */
  slides.forEach(function (slide, i) {
    if (slide.classList.contains('slide--cover')) return;
    var a = document.createElement('div');
    a.className = 'anchors';
    a.setAttribute('aria-hidden', 'true');
    a.innerHTML =
      '<span class="anchors__line"></span>' +
      '<span class="anchors__idx mono">' + pad(i + 1) + '</span>' +
      '<span class="anchors__name mono">' + (slide.getAttribute('data-title') || '') + '</span>' +
      '<i class="cross cross--a"></i><i class="cross cross--b"></i><i class="cross cross--c"></i>';
    slide.insertBefore(a, slide.firstChild);
  });

  /* ---------- Заголовки по буквам ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.split'), function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    var ci = 0;
    var html = text.split(/\s+/).map(function (word) {
      var chars = Array.prototype.map.call(word, function (ch) {
        return '<span class="ch" style="--ci:' + (ci++) + '">' + ch + '</span>';
      }).join('');
      return '<span class="w" aria-hidden="true">' + chars + '</span>';
    }).join(' ');
    el.innerHTML = html;
  });

  /* ---------- Точки ---------- */
  var dots = slides.map(function (slide, i) {
    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dot';
    btn.setAttribute('aria-label', 'Слайд ' + (i + 1) + ': ' + (slide.getAttribute('data-title') || ''));
    btn.addEventListener('click', function () { goTo(i); });
    li.appendChild(btn);
    dotsList.appendChild(li);
    return btn;
  });

  /* ---------- Прогресс, активный слайд, затемнение обложки ---------- */
  var ticking = false;

  function update() {
    ticking = false;
    var top = deck.scrollTop;
    var h = deck.clientHeight;
    var max = deck.scrollHeight - h;
    bar.style.transform = 'scaleX(' + (max > 0 ? top / max : 0) + ')';

    if (cover) {
      var dim = Math.min(1, Math.max(0, top / cover.offsetHeight));
      cover.style.setProperty('--dim', (dim * 0.92).toFixed(3));
    }

    var probe = top + h * 0.4;
    var idx = 0;
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].offsetTop <= probe) idx = i;
    }
    if (top >= max - 2) idx = slides.length - 1;

    if (idx !== current || !dots[idx].hasAttribute('aria-current')) {
      dots.forEach(function (d) { d.removeAttribute('aria-current'); });
      dots[idx].setAttribute('aria-current', 'true');
      current = idx;
    }
  }

  deck.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });

  /* ---------- Мягкий снап на телефоне, если слайд выше экрана ---------- */
  var wirePage = document.querySelector('.wire__page');
  var wireView = document.querySelector('.wire__viewport');

  function layout() {
    var h = deck.clientHeight;
    var tall = slides.some(function (s) { return s.offsetHeight > h + 2; });
    deck.classList.toggle('snap-loose', mobile.matches && tall);
    if (wirePage && wireView) {
      var shift = Math.min(0, wireView.clientHeight - wirePage.scrollHeight);
      wirePage.style.setProperty('--wire-shift', shift + 'px');
    }
    update();
  }

  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();

  /* ---------- Клавиатура ---------- */
  var KEYS_NEXT = { ArrowDown: 1, PageDown: 1, ' ': 1, Spacebar: 1 };
  var KEYS_PREV = { ArrowUp: 1, PageUp: 1 };

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var t = e.target;
    var tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
    var isSpace = e.key === ' ' || e.key === 'Spacebar';
    if (isSpace && (tag === 'BUTTON' || tag === 'A')) return;

    var dir = 0;
    if (KEYS_NEXT[e.key]) dir = e.shiftKey && isSpace ? -1 : 1;
    else if (KEYS_PREV[e.key]) dir = -1;
    if (!dir) return;

    e.preventDefault();

    var top = deck.scrollTop;
    var h = deck.clientHeight;
    var slide = slides[current];
    var sTop = slide.offsetTop;
    var sBottom = sTop + slide.offsetHeight;

    // длинный слайд: сначала дочитываем его, потом листаем дальше
    if (dir > 0 && sBottom > top + h + 4) {
      deck.scrollTo({ top: Math.min(top + h * 0.85, sBottom - h), behavior: behavior() });
      return;
    }
    if (dir < 0 && top > sTop + 4) {
      deck.scrollTo({ top: Math.max(top - h * 0.85, sTop), behavior: behavior() });
      return;
    }
    goTo(current + dir);
  });

  /* ---------- Появление каскадом ---------- */
  slides.forEach(function (slide) {
    var items = slide.querySelectorAll('.reveal');
    for (var i = 0; i < items.length; i++) {
      items[i].style.transitionDelay = (300 + i * 80) + 'ms';
    }
  });

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { root: deck, threshold: 0, rootMargin: '0px 0px -20% 0px' });
    slides.forEach(function (s) { io.observe(s); });
  } else {
    slides.forEach(function (s) { s.classList.add('is-visible'); });
  }

  if (!window.location.hash) deck.focus({ preventScroll: true });
})();
