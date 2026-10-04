(function () {
  'use strict';

  var deck = document.getElementById('deck');
  var slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));
  var bar = document.querySelector('.progress__bar');
  var dotsList = document.querySelector('.dots__list');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = 0;

  function behavior() {
    return reduceMotion.matches ? 'auto' : 'smooth';
  }

  function goTo(index) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    deck.scrollTo({ top: slides[index].offsetTop, behavior: behavior() });
  }

  function clamp01(v) {
    return Math.min(1, Math.max(0, v));
  }

  /* ---------- Разбивка текста на буквы ---------- */
  var ci = 0;
  function splitWords(text, cls) {
    return text.split(/\s+/).filter(Boolean).map(function (word) {
      var chars = Array.prototype.map.call(word, function (ch) {
        return '<span class="ch ' + (cls || '') + '" style="--ci:' + (ci++) + '">' + ch + '</span>';
      }).join('');
      return '<span class="w" aria-hidden="true">' + chars + '</span>';
    }).join(' ');
  }

  Array.prototype.forEach.call(document.querySelectorAll('.split'), function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text + (el.classList.contains('split--dot') ? '.' : ''));
    ci = 0;
    var corners = el.getAttribute('data-corners');
    if (corners) {
      el.innerHTML = corners.split('|').map(function (part) {
        return '<span>' + splitWords(part) + '</span>';
      }).join('');
    } else {
      el.innerHTML = splitWords(text);
    }
    if (el.classList.contains('split--dot')) {
      el.lastElementChild.insertAdjacentHTML('beforeend',
        '<span class="ch dot-accent" style="--ci:' + ci + '">.</span>');
    }
  });

  /* «Каким будет сайт»: буквы заголовка и слова текста проявляются от прокрутки */
  var scrubSlide = document.querySelector('.slide--scrub');
  var scrubParts = [];
  if (scrubSlide) {
    var st = scrubSlide.querySelector('.scrub__title');
    var sx = scrubSlide.querySelector('.scrub__text');
    st.setAttribute('aria-label', st.textContent.trim());
    st.innerHTML = splitWords(st.textContent.trim());
    sx.innerHTML = sx.textContent.trim().split(/\s+/).map(function (w) {
      return '<span class="wd">' + w + '</span>';
    }).join(' ');
    scrubParts = Array.prototype.slice.call(scrubSlide.querySelectorAll('.ch, .wd'));
  }

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

  /* ---------- Цвета финала: плавно от белого к тёмному ---------- */
  var finalSlide = document.querySelector('.slide--final');
  var C_BG_FROM = [244, 243, 238], C_BG_TO = [15, 15, 15];
  var C_FG_FROM = [17, 17, 17], C_FG_TO = [242, 242, 242];
  var C_MU_FROM = [92, 90, 85], C_MU_TO = [163, 163, 163];
  function mix(a, b, t) {
    return 'rgb(' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(',') + ')';
  }

  var parallaxImg = document.querySelector('.parallax');
  var cover = document.querySelector('.slide--cover');

  /* ---------- Скролл ---------- */
  var ticking = false;

  function update() {
    ticking = false;
    var top = deck.scrollTop;
    var h = deck.clientHeight;
    var max = deck.scrollHeight - h;
    bar.style.transform = 'scaleX(' + (max > 0 ? top / max : 0) + ')';

    // параллакс фото на обложке
    if (parallaxImg && !reduceMotion.matches && top < cover.offsetHeight) {
      parallaxImg.style.transform = 'translate3d(0,' + (top * 0.18).toFixed(1) + 'px,0) scale(1.02)';
    }

    // проявление текста по прокрутке
    if (scrubSlide && scrubParts.length) {
      var range = scrubSlide.offsetHeight - h;
      var p = range > 0 ? clamp01((top - scrubSlide.offsetTop + h * 0.35) / (range + h * 0.35)) : 1;
      if (reduceMotion.matches) p = 1;
      var n = Math.round(p * scrubParts.length * 1.08);
      for (var k = 0; k < scrubParts.length; k++) {
        scrubParts[k].classList.toggle('on', k < n);
      }
    }

    // финал темнеет по мере появления
    if (finalSlide) {
      var t = clamp01(1 - (finalSlide.offsetTop - top) / h);
      t = t * t * (3 - 2 * t);
      finalSlide.style.setProperty('--fin-bg', mix(C_BG_FROM, C_BG_TO, t));
      finalSlide.style.setProperty('--fin-fg', mix(C_FG_FROM, C_FG_TO, t));
      finalSlide.style.setProperty('--fin-muted', mix(C_MU_FROM, C_MU_TO, t));
      document.body.style.background = t > 0.5 ? 'rgb(15,15,15)' : '';
    }

    // активная точка
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

  /* ---------- Размеры: прототип, линия этапов ---------- */
  var wirePage = document.querySelector('.wire__page');
  var wireView = document.querySelector('.wire__viewport');
  var stepsList = document.querySelector('.steps');
  var stepsWrap = stepsList && stepsList.parentElement;

  Array.prototype.forEach.call(document.querySelectorAll('.step'), function (s, i) {
    s.style.setProperty('--si', i);
  });

  function layout() {
    if (wirePage && wireView) {
      var shift = Math.min(0, wireView.clientHeight - wirePage.scrollHeight);
      wirePage.style.setProperty('--wire-shift', shift + 'px');
    }
    if (stepsList && stepsWrap) {
      stepsWrap.style.setProperty('--steps-top', stepsList.offsetTop + 'px');
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
      items[i].style.transitionDelay = (250 + i * 80) + 'ms';
    }
  });

  /* ---------- Цифры набегают от нуля, полосы заполняются ---------- */
  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  }
  function countUp(slide) {
    Array.prototype.forEach.call(slide.querySelectorAll('.count'), function (el, i) {
      var to = +el.getAttribute('data-count');
      var suffix = (el.getAttribute('data-suffix') || '').replace('&nbsp;', '\u00a0');
      var delay = 250 + i * 60, dur = 1400, start = null;
      el.textContent = '0' + suffix;
      function step(ts) {
        if (start === null) start = ts + delay;
        var t = Math.min(1, Math.max(0, (ts - start) / dur));
        el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - t, 3)))) + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
    Array.prototype.forEach.call(slide.querySelectorAll('.bar__fill'), function (b, i) {
      b.style.transitionDelay = (250 + i * 80) + 'ms';
    });
  }

  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          if (entry.target.querySelector('.count')) countUp(entry.target);
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
