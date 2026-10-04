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
  var parEls = Array.prototype.map.call(document.querySelectorAll('[data-par]'), function (el) {
    return { el: el, off: +el.getAttribute('data-par'), slide: el.closest('.slide') };
  });
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

    // разная высота карточек выравнивается к центру экрана
    var parOn = !reduceMotion.matches && window.innerWidth >= 768;
    if (!parOn) for (var z = 0; z < parEls.length; z++) parEls[z].el.style.transform = '';
    if (parOn) {
      for (var q = 0; q < parEls.length; q++) {
        var pe = parEls[q];
        var sc = pe.slide.offsetTop + pe.slide.offsetHeight / 2 - top;
        var d = clamp01((sc - h / 2) / h);
        pe.el.style.transform = 'translate3d(0,' + (pe.off * d).toFixed(1) + 'px,0)';
      }
    }

    // линия этапов заполняется по прокрутке и заканчивается на последнем шаге
    if (stepsLine && stepsFill && stepDots.length > 1) {
      var lr = stepsLine.getBoundingClientRect();
      var sp;
      if (stepsVertical) sp = clamp01((h * 0.6 - lr.top) / Math.max(1, lr.height));
      else sp = clamp01((h * 0.8 - lr.top) / (h * 0.45));
      if (reduceMotion.matches) sp = 1;
      stepsFill.style.transform = stepsVertical ? 'scaleY(' + sp + ')' : 'scaleX(' + sp + ')';
      var n1 = stepEls.length - 1;
      for (var si = 0; si < stepEls.length; si++) {
        stepEls[si].classList.toggle('on', sp >= si / n1 - 0.001);
      }
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
      document.body.style.background = t > 0.5 ? '#000' : '';
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

  var stepEls = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var stepDots = stepEls.map(function (s) { return s.querySelector('.step__dot'); });
  var stepsLine = document.querySelector('.steps-line');
  var stepsFill = document.querySelector('.steps-line__fill');
  var stepsVertical = true;
  Array.prototype.forEach.call(document.querySelectorAll('.step'), function (s, i) {
    s.style.setProperty('--si', i);
  });

  function layout() {
    if (wirePage && wireView) {
      var shift = Math.min(0, wireView.clientHeight - wirePage.scrollHeight);
      wirePage.style.setProperty('--wire-shift', shift + 'px');
    }
    if (stepsList && stepsWrap && stepDots.length > 1) {
      // offsetTop/offsetLeft не учитывают сдвиг анимации появления
      var c = stepEls.map(function (st, i) {
        var d = stepDots[i];
        return {
          x: stepsList.offsetLeft + st.offsetLeft + d.offsetLeft + d.offsetWidth / 2,
          y: stepsList.offsetTop + st.offsetTop + d.offsetTop + d.offsetHeight / 2
        };
      });
      var first = c[0], last = c[c.length - 1];
      stepsVertical = Math.abs(last.y - first.y) > Math.abs(last.x - first.x);
      var ls = stepsLine.style;
      ls.top = first.y + 'px';
      ls.left = first.x + 'px';
      ls.right = 'auto';
      ls.bottom = 'auto';
      ls.width = stepsVertical ? '1px' : (last.x - first.x) + 'px';
      ls.height = stepsVertical ? (last.y - first.y) + 'px' : '1px';
      stepsFill.style.transformOrigin = '0 0';
    }
    update();
  }

  window.addEventListener('resize', layout);
  window.addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();

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
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io2.unobserve(entry.target);
        }
      });
    }, { root: deck, threshold: 0, rootMargin: '0px 0px -12% 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.slide--long .reveal'), function (el) {
      el.style.transitionDelay = '0ms';
      io2.observe(el);
    });
  } else {
    slides.forEach(function (s) { s.classList.add('is-visible'); });
  }

  if (!window.location.hash) deck.focus({ preventScroll: true });
})();
