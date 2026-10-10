(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  if (window.self !== window.top || params.get('frame') === '1') document.body.classList.add('in-frame');

  /* бургер */
  var hdr = document.querySelector('.hdr');
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = hdr.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    hdr.querySelectorAll('.hdr__nav a').forEach(function (a) {
      a.addEventListener('click', function () { hdr.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* окно оплаты */
  var modal = document.getElementById('pay');
  var what = document.getElementById('pay-what');
  var payBtn = document.getElementById('pay-btn');
  var form = document.getElementById('pay-form');
  var lastFocus = null;
  var current = { name: '', price: '' };

  function openPay(name, price) {
    current = { name: name, price: price };
    what.textContent = name + ' · ' + price;
    payBtn.textContent = 'Оплатить ' + price;
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    var first = modal.querySelector('input');
    if (first) first.focus();
  }
  function closePay() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-buy]');
    if (b) { e.preventDefault(); openPay(b.getAttribute('data-buy'), b.getAttribute('data-price')); return; }
    if (e.target.closest('[data-close]')) closePay();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closePay(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = new URLSearchParams({ p: current.name });
    location.href = 'spasibo.html?' + q.toString() + (document.body.classList.contains('in-frame') ? '&frame=1' : '');
  });

  /* страница «Спасибо»: подставляем купленный продукт */
  var thanks = document.getElementById('thanks-text');
  if (thanks && params.get('p')) {
    thanks.textContent = 'Ссылка на «' + params.get('p') + '» придёт на почту, которую вы указали при оплате, в течение 15 минут.';
  }

  /* панель прототипа */
  var pt = document.querySelector('.pt');
  var toggle = pt && pt.querySelector('.pt__toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = pt.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var notes = document.getElementById('pt-notes');
  var saved = null;
  try { saved = localStorage.getItem('proto-notes'); } catch (err) { saved = null; }
  if (saved === 'off') { document.body.classList.add('no-notes'); if (notes) notes.checked = false; }
  if (notes) notes.addEventListener('change', function () {
    document.body.classList.toggle('no-notes', !notes.checked);
    try { localStorage.setItem('proto-notes', notes.checked ? 'on' : 'off'); } catch (err) { /* без хранилища тоже работает */ }
  });
  var viewer = document.getElementById('pt-viewer');
  if (viewer) viewer.href = 'viewer.html?page=' + encodeURIComponent(location.pathname.split('/').pop() || 'index.html');

  /* в рамке ссылки остаются в рамке */
  if (document.body.classList.contains('in-frame')) {
    document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (h.indexOf('frame=1') < 0 && h.indexOf('http') !== 0) {
        var parts = h.split('#');
        a.setAttribute('href', parts[0] + (parts[0].indexOf('?') < 0 ? '?' : '&') + 'frame=1' + (parts[1] ? '#' + parts[1] : ''));
      }
    });
  }
})();
