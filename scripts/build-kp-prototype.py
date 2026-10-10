#!/usr/bin/env python3
"""Генератор кликабельного прототипа mrs.alinaas (структура из Figma)."""
# Запуск: python3 scripts/build-kp-prototype.py kp-alinaas/prototype
import html, os, sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
E = html.escape

PAGES = [
    ('index.html', 'Главная'),
    ('magiya-5-utra.html', 'Магия 5 утра'),
    ('cookbook.html', 'CookBook'),
    ('zavtraki.html', 'Завтраки'),
    ('detox.html', 'Detox'),
    ('selfbody.html', 'SELFBODY'),
]
HREF = {'Магия 5 утра': 'magiya-5-utra.html', 'Alina CookBook': 'cookbook.html', 'Полезные завтраки': 'zavtraki.html',
        'Detox': 'detox.html', 'SELFBODY': 'selfbody.html'}
IMG = {'Магия 5 утра': '../img/p-magic.webp', 'Alina CookBook': '../img/p-cookbook.webp', 'Полезные завтраки': '../img/p-breakfasts.webp',
       'Detox': '../img/p-detox.webp', 'SELFBODY': '../img/p-selfbody.webp'}
PRICE = {'Магия 5 утра': '3 299 ₽', 'Alina CookBook': '3 499 ₽', 'Полезные завтраки': '1 699 ₽', 'Detox': '1 399 ₽', 'SELFBODY': '4 990 ₽'}

def tag(s): return f'<span class="tag">{E(s)}</span>'
def note(s): return f'<p class="note">Уточнить: {E(s)}</p>' if s else ''
def ph(label, cls='', src=None):
    if src:
        return f'<div class="ph has-img {cls}"><img src="{src}" alt="{E(label)}" loading="lazy"></div>'
    return f'<div class="ph {cls}" role="img" aria-label="{E(label)}"><span>{E(label)}</span></div>'
def buy(product, price, label=None, cls='btn'):
    return f'<button class="{cls}" type="button" data-buy="{E(product)}" data-price="{E(price)}">{E(label or "Купить")}</button>'
def link(label, href, cls='btn btn--line'): return f'<a class="{cls}" href="{href}">{E(label)}</a>'
def price_html(p, old=None, cls=''):
    o = f' <s>{E(old)}</s>' if old else ''
    return f'<p class="price {cls}">{E(p)}{o}</p>'

def head_block(b, dark=False):
    out = ''
    if b.get('tag'): out += tag(b['tag'])
    if b.get('h'): out += f'<h2>{E(b["h"])}</h2>'
    if b.get('sub'): out += f'<p class="sub">{E(b["sub"])}</p>'
    out += note(b.get('note'))
    return out

def section(b, inner, cls=''):
    return f'<section class="blk {cls}" id="{b.get("id","")}"><div class="wrap">{inner}</div></section>'

def r_hero(b):
    bullets = ''.join(f'<li>{E(x)}</li>' for x in b.get('bullets', []))
    btns = ''
    if b.get('buy'): btns += buy(b['buy'][0], b['buy'][1], b['buy'][2])
    if b.get('btn'): btns += link(b['btn'][0], b['btn'][1], 'btn')
    if b.get('btn2'): btns += link(b['btn2'][0], b['btn2'][1])
    pr = price_html(b['price'], b.get('old'), 'price--lg') if b.get('price') else ''
    txt = (f'<div class="hero__text">{tag(b["tag"])}'
           + (f'<p class="eyebrow">{E(b["eyebrow"])}</p>' if b.get('eyebrow') else '')
           + f'<h1>{E(b["h"])}</h1>'
           + (f'<p class="sub">{E(b["sub"])}</p>' if b.get('sub') else '')
           + (f'<ul class="ticks">{bullets}</ul>' if bullets else '') + pr
           + f'<div class="btns">{btns}</div>{note(b.get("note"))}</div>')
    img = ph(b.get('photo', 'Фото'), 'ph--hero', b.get('src'))
    return section(b, f'<div class="hero {"hero--flip" if b.get("flip") else ""}">{txt}{img}</div>', 'blk--soft' if b.get('soft') else '')

def r_points(b):
    items = ''.join(f'<li class="point"><span class="dot" aria-hidden="true"></span><h3>{E(t)}</h3>{f"<p>{E(d)}</p>" if d else ""}</li>' for t, d in b['items'])
    return section(b, head_block(b) + f'<ul class="grid grid--{b.get("per",3)}">{items}</ul>', 'blk--soft' if b.get('soft') else '')

def card(it):
    imgsrc = IMG.get(it.get('title')) if it.get('real') else None
    img = ph(it.get('photo', 'Фото'), 'ph--card' + (' ph--wide' if it.get('wide') else ''), imgsrc)
    kicker = f'<p class="kicker">{E(it["kicker"])}</p>' if it.get('kicker') else ''
    txt = f'<p>{E(it["text"])}</p>' if it.get('text') else ''
    pr = price_html(it['price'], it.get('old')) if it.get('price') else ''
    b = ''
    if it.get('href'): b = link(it.get('btn', 'Подробнее'), it['href'], 'btn btn--line btn--sm')
    return f'<li class="card">{img}{kicker}<h3>{E(it["title"])}</h3>{txt}{pr}{b}</li>'

def r_cards(b):
    items = ''.join(card(it) for it in b['items'])
    scroll = ' scroller' if b.get('scroll', True) else ''
    return section(b, head_block(b) + f'<p class="swipe">Листайте вбок</p><ul class="grid grid--{b.get("per",3)}{scroll}">{items}</ul>', 'blk--soft' if b.get('soft') else '')

def r_table(b):
    th = ''.join(f'<th scope="col">{E(c)}</th>' for c in b['cols'])
    rows = ''.join('<tr><th scope="row">' + E(r[0]) + '</th>' + ''.join(f'<td>{E(c)}</td>' for c in r[1:]) + '</tr>' for r in b['rows'])
    cards = ''
    for j, name in enumerate(b['cols'][1:], start=1):
        dl = ''.join(f'<dt>{E(r[0])}</dt><dd>{E(r[j])}</dd>' for r in b['rows'])
        cards += f'<li class="cmp-card"><h3><a href="{HREF.get(name, "#")}">{E(name)}</a></h3><dl>{dl}</dl></li>'
    return section(b, head_block(b) + f'<div class="cmp-table"><table>{th and "<thead><tr>"+th+"</tr></thead>"}<tbody>{rows}</tbody></table></div>'
                   f'<p class="swipe">Листайте вбок</p><ul class="cmp-cards scroller">{cards}</ul>', 'blk--soft')

def r_about(b):
    stats = ''.join(f'<li><b>{E(a)}</b><span>{E(c)}</span></li>' for a, c in b.get('stats', []))
    inner = (f'<div class="about">{ph(b["photo"], "ph--about")}<div class="about__text">{tag(b["tag"])}<h2>{E(b["h"])}</h2>'
             f'<p class="sub">{E(b["text"])}</p>' + (f'<ul class="stats">{stats}</ul>' if stats else '')
             + '<div class="btns"><a class="btn btn--line" href="#">Мой Instagram</a></div>' + note(b.get('note')) + '</div></div>')
    return section(b, inner)

def r_reviews(b):
    items = ''.join(f'<li>{ph(b.get("label","Скриншот отзыва"), "ph--review")}</li>' for _ in range(b.get('n', 5)))
    return section(b, head_block(b) + f'<p class="swipe">Листайте вбок</p><ul class="reviews scroller">{items}</ul>', 'blk--soft' if b.get('soft') else '')

def r_cta(b):
    bullets = ''.join(f'<li>{E(x)}</li>' for x in b.get('bullets', []))
    pr = price_html(b['price'], b.get('old'), 'price--lg') if b.get('price') else ''
    action = buy(b['buy'][0], b['buy'][1], b['buy'][2], 'btn btn--light') if b.get('buy') else f'<a class="btn btn--light" href="#">{E(b["btn"])}</a>'
    txt = (f'<div class="cta__text">{tag(b["tag"])}<h2>{E(b["h"])}</h2>' + (f'<p class="sub">{E(b["sub"])}</p>' if b.get('sub') else '')
           + (f'<ul class="ticks">{bullets}</ul>' if bullets else '') + pr + f'<div class="btns">{action}</div>{note(b.get("note"))}</div>')
    img = ph(b['photo'], 'ph--cta') if b.get('photo') else ''
    return section(b, f'<div class="cta">{txt}{img}</div>', 'blk--dark')

def r_price(b):
    cards = ''
    for it in b['items']:
        ticks = ''.join(f'<li>{E(x)}</li>' for x in it.get('bullets', []))
        cards += (f'<li class="plan {"plan--dark" if it.get("dark") else ""}"><h3>{E(it["title"])}</h3>{price_html(it["price"], it.get("old"), "price--lg")}'
                  f'<ul class="ticks">{ticks}</ul>{buy(it["product"], it["price"], it["btn"], "btn btn--light" if it.get("dark") else "btn")}'
                  + (f'<p class="small">{E(it["small"])}</p>' if it.get('small') else '') + '</li>')
    return section(b, head_block(b) + f'<ul class="plans plans--{len(b["items"])}">{cards}</ul>', 'blk--soft' if b.get('soft') else '')

def r_faq(b):
    qs = ''
    for i, q in enumerate(b['q']):
        a = q[1] if len(q) > 1 else 'Здесь будет ответ. Текст согласуем на брифинге.'
        qs += f'<details{" open" if i == 0 else ""}><summary>{E(q[0])}</summary><p>{E(a)}</p></details>'
    return section(b, head_block(b) + f'<div class="faq">{qs}</div><div class="btns"><a class="btn btn--line" href="#">{E(b.get("btn","Написать в отдел заботы"))}</a></div>')

def r_fit(b):
    yes = ''.join(f'<li>{E(x)}</li>' for x in b['yes']); no = ''.join(f'<li>{E(x)}</li>' for x in b['no'])
    return section(b, head_block(b) + f'<div class="fit"><div class="fit__col"><h3>Тебе подойдёт, если хочешь</h3><ul class="ticks">{yes}</ul></div>'
                   f'<div class="fit__col fit__col--no"><h3>Не подойдёт, если ты</h3><ul class="crosses">{no}</ul></div></div>')

def r_program(b):
    cols = ''.join(f'<li class="prog"><h3>{E(t)}</h3><ul>{"".join(f"<li>{E(x)}</li>" for x in xs)}</ul></li>' for t, xs in b['items'])
    return section(b, head_block(b) + f'<ul class="grid grid--3">{cols}</ul>', 'blk--soft')

def r_steps(b):
    items = ''.join(f'<li class="step"><span class="step__n">{i+1}</span><h3>{E(t)}</h3><p>{E(d)}</p></li>' for i, (t, d) in enumerate(b['items']))
    return section(b, head_block(b) + f'<ol class="grid grid--3 steps">{items}</ol>', 'blk--soft')

def r_thanks(b):
    return section(b, f'<div class="thanks">{tag(b["tag"])}<h1>{E(b["h"])}</h1><p class="sub" id="thanks-text">{E(b["sub"])}</p>{note(b.get("note"))}</div>')

def r_doc(b):
    parts = ''.join(f'<h3>{E(t)}</h3><div class="doc__lines"><span></span><span></span><span></span></div>' for t in b['parts'])
    return section(b, head_block(b) + f'<div class="doc">{parts}</div>')

R = {k[2:]: v for k, v in globals().items() if k.startswith('r_')}

NAV = [('Магия 5 утра', 'magiya-5-utra.html'), ('CookBook', 'cookbook.html'), ('Завтраки', 'zavtraki.html'), ('Detox', 'detox.html'),
       ('SELFBODY', 'selfbody.html'), ('Отзывы', 'index.html#reviews'), ('FAQ', 'index.html#faq')]

def header(cur):
    nav = ''.join(f'<a href="{h}"{" aria-current=page" if h == cur else ""}>{E(t)}</a>' for t, h in NAV)
    return (f'<header class="hdr"><div class="wrap hdr__in"><a class="logo" href="index.html">MRS.ALINAAS</a>'
            f'<nav class="hdr__nav" id="nav" aria-label="Меню">{nav}<a class="btn btn--sm hdr__cta" href="magiya-5-utra.html">Начать с «Магии 5 утра»</a></nav>'
            f'<button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button></div></header>')

FOOTER = ('<footer class="blk blk--dark ftr"><div class="wrap">' + tag('Подвал') + '<div class="ftr__grid">'
          '<div><b>MRS.ALINAAS</b><p>food blogger | sport | self-care</p></div>'
          '<div><b>Продукты</b>' + ''.join(f'<a href="{h}">{E(t)}</a>' for t, h in [('Магия 5 утра', 'magiya-5-utra.html'), ('Alina CookBook', 'cookbook.html'), ('Полезные завтраки', 'zavtraki.html'), ('Detox', 'detox.html'), ('SELFBODY', 'selfbody.html')]) + '</div>'
          '<div><b>Помощь</b><a href="#">Отдел заботы</a><a href="#">Telegram-канал</a><a href="#">Instagram*</a></div>'
          '<div><b>Документы</b><a href="oferta.html">Договор оферты</a><a href="oferta.html">Политика конфиденциальности</a><p>ИП Васильева А. М.<br>ИНН 502725055928<br>ОГРНИП 321774600793913</p></div>'
          '</div><p class="small">*Instagram принадлежит Meta, деятельность которой запрещена в РФ</p></div></footer>')

MODAL = ('<div class="modal" id="pay" hidden><div class="modal__bg" data-close></div><div class="modal__box" role="dialog" aria-modal="true" aria-labelledby="pay-title">'
         '<button class="modal__x" type="button" data-close aria-label="Закрыть">×</button>' + tag('Окно оплаты') +
         '<h2 id="pay-title">Оформление заказа</h2><p class="sub" id="pay-what">Продукт</p>'
         '<form id="pay-form"><label>Ваше имя<input type="text" required placeholder="Алина" autocomplete="name"></label>'
         '<label>E-mail для получения файла<input type="email" required placeholder="name@mail.ru" autocomplete="email"></label>'
         '<p class="small">Лучше Gmail, Яндекс или Mail.ru: на iCloud и Hotmail письмо может не дойти</p>'
         '<div class="promo"><label>Промокод<input type="text" placeholder="Если есть"></label><button class="btn btn--line" type="button">Применить</button></div>'
         '<label class="chk"><input type="checkbox" required checked> Принимаю условия <a href="oferta.html">оферты</a></label>'
         '<label class="chk"><input type="checkbox" required checked> Согласна с <a href="oferta.html">политикой конфиденциальности</a></label>'
         '<button class="btn btn--full" type="submit" id="pay-btn">Оплатить</button><p class="small">Доступна оплата иностранными картами</p>'
         '<p class="note">Уточнить: нужны ли имя и телефон, какая платёжная система, есть ли оплата частями</p></form></div></div>')

TOOLBAR = ('<aside class="pt" aria-label="Панель прототипа"><button class="pt__toggle" type="button" aria-expanded="false">Прототип</button>'
           '<div class="pt__menu"><p class="pt__title">Страницы</p>' + ''.join(f'<a href="{h}">{E(t)}</a>' for h, t in PAGES) +
           '<a href="spasibo.html">Спасибо за покупку</a><a href="oferta.html">Документы</a>'
           '<p class="pt__title">Вид</p><label class="pt__sw"><input type="checkbox" id="pt-notes" checked> Заметки «Уточнить»</label>'
           '<a href="viewer.html" id="pt-viewer">Открыть в рамке устройства</a></div></aside>')

def page(fname, title, blocks, desc):
    body = ''.join(R[b['t']](b) for b in blocks)
    return f'''<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>{E(title)} · прототип mrs.alinaas</title>
<meta name="description" content="{E(desc)}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%A4%8D%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="proto.css">
</head>
<body>
<div class="banner">Прототип структуры: без дизайна, тексты черновые · <a href="https://kp.slmn2.ru/">КП</a></div>
{header(fname)}
<main>{body}</main>
{FOOTER}
{MODAL}
{TOOLBAR}
<script src="proto.js" defer></script>
</body>
</html>
'''

FAQ_STD = [['В каком формате я получу продукт?', 'PDF-файл: открывается на телефоне и компьютере, можно распечатать. Доступ бессрочный.'],
           ['Как и куда придёт доступ?', 'В течение 15 минут после оплаты ссылка придёт на почту, указанную при оформлении.'],
           ['Можно оплатить иностранной картой?', 'Да, на странице оплаты выберите способ «зарубежные карты».'],
           ['Что делать, если письмо не пришло?', 'Проверьте «Спам» и «Промоакции». Если письма нет, напишите в отдел заботы.']]
ALL = [dict(title='Магия 5 утра', real=1, kicker='Входной продукт', text='Путеводитель, 90+ страниц', price='3 299 ₽', old='3 699 ₽', href='magiya-5-utra.html'),
       dict(title='Alina CookBook', real=1, kicker='PDF · печатная', text='85+ рецептов', price='3 499 ₽', old='3 899 ₽', href='cookbook.html'),
       dict(title='Полезные завтраки', real=1, kicker='PDF · печатная', text='45+ рецептов', price='1 699 ₽', old='1 999 ₽', href='zavtraki.html'),
       dict(title='Detox', real=1, kicker='PDF', text='35+ шотов и смузи', price='1 399 ₽', old='1 699 ₽', href='detox.html'),
       dict(title='SELFBODY', real=1, kicker='Интенсив 21 день', text='Тренировки и питание', price='4 990 ₽', old='6 990 ₽', href='selfbody.html')]
def others(name): return dict(t='cards', tag='Другие продукты', h='Вам может понравиться', per=3, items=[x for x in ALL if x['title'] != name][:3])
def about(text, photo): return dict(t='about', tag='Об авторе', h='Алина, автор MRS ALINAAS', text=text, photo=photo)

SPEC = {}
SPEC['index.html'] = ('Главная', 'Витрина бренда: кто вы, с чего начать, все продукты', [
    dict(t='hero', tag='Первый экран', eyebrow='Wellness · питание · тренировки', h='Забота о себе, которая становится привычкой',
         sub='Гайды, рецепты и тренировки от Алины. Начните с «Магии 5 утра»', btn=('Начать с «Магии 5 утра»', 'magiya-5-utra.html'), btn2=('Все продукты', '#catalog'),
         photo='Фото Алины', src='../img/alina.webp', note='оффер и формулировка первого экрана'),
    dict(t='hero', tag='Входной продукт', soft=1, flip=1, eyebrow='Путеводитель по здоровому образу жизни', h='Магия 5 утра',
         sub='Сон, ранние подъёмы, питание, тренировки и ритуалы: всё, чтобы ваше утро было идеальным',
         bullets=['90+ страниц', 'PDF с бессрочным доступом', 'Оплата иностранными картами'], price='3 299 ₽', old='3 699 ₽',
         buy=('Магия 5 утра', '3 299 ₽', 'Купить гайд'), btn2=('Подробнее', 'magiya-5-utra.html'), photo='Обложка и развороты гайда', src='../img/p-magic.webp'),
    dict(t='about', tag='Обо мне', h='Привет, я Алина', text='Короткая история: как я пришла к здоровому образу жизни, мой опыт и почему мне доверяют.',
         stats=[('[N] тыс.', 'подписчиц в Instagram'), ('[N]', 'проданных гайдов'), ('[N] лет', 'в теме ЗОЖ')], photo='Портрет Алины', note='история, цифры и регалии'),
    dict(t='table', tag='Какой продукт выбрать', h='С чего начать', sub='Сравните продукты и выберите свой', note='для кого каждый продукт, одной фразой',
         cols=['', 'Магия 5 утра', 'Alina CookBook', 'Полезные завтраки', 'Detox', 'SELFBODY'],
         rows=[['Для кого', 'Хочу начать ЗОЖ', 'Хочу готовить полезно', 'Нет времени на завтрак', 'Хочу лёгкости и энергии', 'Хочу тело за 21 день'],
               ['Что внутри', 'Сон, утро, питание, тренировки', '85+ рецептов', '45+ рецептов', '35+ шотов и смузи', 'Тренировки, питание, привычки'],
               ['Формат', 'PDF', 'PDF или печатная', 'PDF или печатная', 'PDF', 'Приложение, 30 дней'],
               ['Цена', '3 299 ₽', '3 499 ₽', '1 699 ₽', '1 399 ₽', '4 990 ₽']]),
    dict(t='cards', id='catalog', tag='Каталог', h='Мои продукты', sub='Единая подача цены, кнопки «Подробнее»', per=5, items=ALL),
    dict(t='cta', tag='Набор', h='Три сборника со скидкой 20%', sub='Alina CookBook, «Полезные завтраки» и «Магия 5 утра»', price='5 999 ₽', old='8 699 ₽',
         buy=('Набор: 3 сборника', '5 999 ₽', 'Купить набор'), photo='Три обложки веером'),
    dict(t='reviews', id='reviews', tag='Отзывы', h='Что говорят читательницы', sub='Реальные сообщения и результаты'),
    dict(t='cta', tag='Закрытый Telegram-канал', h='Рецепты, которых нет в Instagram', sub='Закрытое комьюнити с ноября',
         bullets=['Новые рецепты каждую неделю', 'Разборы рациона', 'Общение с Алиной'], btn='Вступить в канал', photo='Мокап канала в телефоне',
         note='формат канала: платный или бесплатный, что внутри, как попасть'),
    dict(t='faq', id='faq', tag='FAQ', h='Частые вопросы', q=FAQ_STD + [['Доступ бессрочный?', 'Да, файл остаётся у вас навсегда.']]),
])
SPEC['magiya-5-utra.html'] = ('Магия 5 утра', 'Путеводитель по здоровому образу жизни', [
    dict(t='hero', tag='Первый экран', eyebrow='Путеводитель по здоровому образу жизни', h='Магия 5 утра',
         sub='Полное руководство, которое научит любить себя, своё тело и быть в гармонии с собой',
         bullets=['90+ страниц', 'PDF с бессрочным доступом', 'Ссылка на почту в течение 15 минут'], price='3 299 ₽', old='3 699 ₽',
         buy=('Магия 5 утра', '3 299 ₽', 'Купить гайд'), btn2=('Что внутри', '#inside'), photo='Обложка гайда', src='../img/p-magic.webp',
         note='одно название: «Магия 5 утра» или «Путеводитель по здоровому образу жизни»'),
    dict(t='points', tag='Для кого', h='Гайд для вас, если вы хотите', per=4, note='для кого гайд: подтвердить формулировки',
         items=[('Просыпаться рано', 'без будильника и без чувства разбитости'), ('Наладить питание', 'понять принципы и перестать срываться'),
                ('Прийти к красивому телу', 'через тренировки и привычки, без жёстких диет'), ('Утренние ритуалы', 'которые помогают выбирать себя каждый день')]),
    dict(t='cards', id='inside', tag='Что внутри', h='Что вас ждёт внутри', sub='Главы гайда с превью разворотов', per=4, note='3–5 разворотов гайда для превью',
         items=[dict(title=t, text=d, photo='Превью разворота', wide=1) for t, d in [('Сон и здоровье', 'Правила крепкого, глубокого сна'),
                ('Ранние подъёмы', 'Личная методика: просыпаться без будильника'), ('Утренние ритуалы', 'Как из ритуала сделать привычку'),
                ('Принципы питания', 'Лёгкость днём, без отёков утром'), ('9 советов по питанию', 'Переоценка привычных продуктов'),
                ('Рецепты, богатые белком', 'Мышцы в тонусе, красивое тело'), ('Напитки, которые исцеляют', 'Что пить утром и чего избегать'),
                ('Тренировки, витамины, БАДы', 'План на каждый день и мои средства')]]),
    dict(t='points', tag='Результат', soft=1, h='Что изменится', per=4, items=[('Утро без будильника', 'спокойный подъём и время для себя'),
         ('Лёгкость днём', 'без переедания и отёков'), ('Понятный рацион', 'знаете, что и когда есть'), ('Режим движения', 'тренировки, которые встраиваются в день')]),
    about('Коротко: кто я, мой путь к здоровому образу жизни и почему эти практики работают.', 'Портрет Алины'),
    dict(t='reviews', tag='Отзывы', h='Отзывы о гайде', note='подборка отзывов именно о «Магии 5 утра»'),
    dict(t='price', tag='Цена и формат', h='Стоимость', items=[
        dict(title='Гайд «Магия 5 утра», PDF', price='3 299 ₽', old='3 699 ₽', bullets=['90+ страниц', 'Бессрочный доступ', 'Ссылка на почту за 15 минут', 'Оплата иностранными картами'], btn='Купить гайд', product='Магия 5 утра', dark=1),
        dict(title='Выгоднее в наборе: 3 сборника', price='5 999 ₽', old='8 699 ₽', bullets=['Магия 5 утра', 'Alina CookBook', 'Полезные завтраки'], btn='Купить набор', product='Набор: 3 сборника')]),
    dict(t='faq', tag='FAQ', h='Вопросы о гайде', q=FAQ_STD + [['Подойдёт, если я сова и никогда не вставала рано?']]),
    others('Магия 5 утра'),
])
SPEC['cookbook.html'] = ('Alina CookBook', 'Книга рецептов: PDF и печатная версия', [
    dict(t='hero', tag='Первый экран', eyebrow='Книга рецептов', h='Alina CookBook', sub='Простые, эстетичные и сбалансированные рецепты, которые делают жизнь вкуснее и тело сильнее',
         bullets=['85+ рецептов на каждый день', 'PDF или печатная книга', 'Оплата иностранными картами'], price='3 499 ₽', old='3 899 ₽',
         buy=('Alina CookBook', '3 499 ₽', 'Купить книгу'), btn2=('Что внутри', '#inside'), photo='Обложка книги', src='../img/p-cookbook.webp',
         note='актуальная цена: 3 499 ₽ на главной и 2 999 ₽ в оплате на странице книги'),
    dict(t='points', tag='Для кого', h='Книга для вас, если вы', per=4, items=[('Хотите питаться полезно', 'и не скучать от пресных блюд'),
         ('Не знаете, что приготовить', '85+ идей на каждый день'), ('Готовите для семьи', 'блюда, которые понравятся всем'), ('Следите за фигурой', 'десерты без вреда для фигуры')]),
    dict(t='cards', id='inside', tag='Что внутри', h='Разделы книги', sub='Превью разворотов по разделам', per=3, note='по разделам 73 рецепта, заявлено 85+; что за бонус и сколько страниц',
         items=[dict(title=t, text=d, photo='Разворот', wide=1) for t, d in [('Завтраки', '27 полезных и сытных рецептов'), ('Обеды', '21 блюдо, после которого не тянет перекусывать'),
                ('Салаты', '8 рецептов зелёных салатов'), ('ПП-десерты', '17 рецептов без вреда для фигуры'), ('Принципы питания', 'Как собрать сбалансированную тарелку'), ('Бонус', '[что входит в бонус]')]]),
    dict(t='points', tag='Результат', soft=1, h='Что изменится', per=3, items=[('Меню без раздумий', 'всегда есть идея на завтрак, обед и десерт'),
         ('Еда как забота о себе', 'красиво, вкусно и с любовью'), ('Лёгкость в теле', 'сбалансированные блюда без срывов')]),
    about('Коротко: кто я, мой путь к здоровому питанию и почему этим рецептам можно доверять.', 'Портрет Алины на кухне'),
    dict(t='reviews', tag='Отзывы', h='Отзывы читательниц', note='отзывы о книге, по возможности с фото блюд'),
    dict(t='price', tag='Цена и формат', h='Выберите формат', items=[
        dict(title='Электронная версия, PDF', price='3 499 ₽', old='3 899 ₽', bullets=['85+ рецептов', 'Бессрочный доступ', 'Ссылка на почту за 15 минут'], btn='Купить PDF', product='Alina CookBook, PDF', dark=1),
        dict(title='Печатная книга', price='4 299 ₽', bullets=['Осталось [N] шт.', 'Доставка СДЭК, оплачивается отдельно', 'Срок отправки: [N] дней'], btn='Заказать печатную', product='Alina CookBook, печатная')]),
    dict(t='faq', tag='FAQ', h='Вопросы о книге', q=FAQ_STD + [['Как доставляется печатная книга и сколько стоит доставка?']]),
    others('Alina CookBook'),
])
SPEC['zavtraki.html'] = ('Полезные завтраки', 'Сборник завтраков: PDF и печатная версия по предзаказу', [
    dict(t='hero', tag='Первый экран', eyebrow='Сборник рецептов', h='Полезные завтраки', sub='Самые разнообразные, вкусные и сбалансированные завтраки на каждый день',
         bullets=['45+ рецептов', 'Простые продукты и пошаговые инструкции', 'Бонус: видеоурок по обработке food-фото'], price='1 699 ₽', old='1 999 ₽',
         buy=('Полезные завтраки', '1 699 ₽', 'Купить сборник'), btn2=('Что внутри', '#inside'), photo='Обложка сборника', src='../img/p-breakfasts.webp',
         note='старая цена: 1 999 ₽ на главной и 2 299 ₽ на странице сборника'),
    dict(t='points', tag='Для кого', h='Сборник подойдёт, если вы хотите', per=3, items=[('Перестать пропускать завтраки', 'даже когда нет времени'),
         ('Разнообразить утро', 'блюдами, которые понравятся всей семье'), ('Заменить перекусы на бегу', 'на правильные завтраки и прийти в форму без срывов')]),
    dict(t='cards', id='inside', tag='Что внутри', h='Разделы сборника', sub='Превью разворотов по разделам', per=4, note='сколько рецептов в каждом разделе и сколько страниц',
         items=[dict(title=t, text=d, photo='Разворот', wide=1) for t, d in [('Блюда из яиц', '[N] рецептов'), ('Блины и панкейки', '[N] рецептов'), ('Тосты', '[N] рецептов'),
                ('Вафли', '[N] рецептов'), ('Йогурты и каши', '[N] рецептов'), ('Десерты и выпечка из творога', '[N] рецептов'), ('Бонус: видеоурок', 'Как я обрабатываю food-фото')]]),
    dict(t='points', tag='Результат', soft=1, h='Готовить завтраки станет приятнее', per=3, items=[('Никаких раздумий', '«что бы приготовить?» больше не вопрос'),
         ('Быстро и вкусно', 'простые продукты, понятные шаги'), ('Энергия на весь день', 'сбалансированный белок с утра')]),
    about('Все рецепты входят в мой постоянный рацион: именно эти завтраки вы видите у меня в Instagram.', 'Алина за завтраком'),
    dict(t='reviews', tag='Отзывы', h='Отзывы моих читательниц'),
    dict(t='price', tag='Цена и формат', h='Выберите формат', note='когда новый тираж и оставляем ли предзаказ на сайте', items=[
        dict(title='Электронный сборник, PDF', price='1 699 ₽', old='1 999 ₽', bullets=['45+ рецептов', 'Бонус: видеоурок', 'Бессрочный доступ'], btn='Купить PDF', product='Полезные завтраки, PDF', dark=1),
        dict(title='Печатный сборник, предзаказ', price='2 399 ₽', old='3 099 ₽', bullets=['Отправим, когда придёт новый тираж', 'Доставка СДЭК, оплачивается отдельно'], btn='Оформить предзаказ', product='Полезные завтраки, печатный')]),
    dict(t='faq', tag='FAQ', h='Вопросы о сборнике', q=FAQ_STD + [['Когда отправят печатный сборник по предзаказу?']]),
    others('Полезные завтраки'),
])
SPEC['detox.html'] = ('Detox', 'Сборник утренних шотов и смузи', [
    dict(t='hero', tag='Первый экран', eyebrow='Сборник утренних шотов и смузи', h='Detox', sub='Для лёгкости, энергии и красоты тела. Открыла, выбрала, приготовила за 1–2 минуты',
         bullets=['35+ рецептов', 'Без редких ингредиентов', 'PDF с бессрочным доступом'], price='1 399 ₽', old='1 699 ₽',
         buy=('Detox', '1 399 ₽', 'Купить сборник'), btn2=('Что внутри', '#inside'), photo='Обложка сборника', src='../img/p-detox.webp',
         note='на странице одновременно «Скоро в продаже» и кнопка покупки: сборник уже продаётся?'),
    dict(t='points', tag='Для кого', h='Сборник для вас, если вы хотите', sub='Подойдёт и новичкам, и тем, кто давно в теме здоровья', per=3,
         items=[('Начать утро с ритуала', 'и зарядиться энергией на весь день'), ('Добавить wellness в жизнь', 'постепенно прийти к здоровым привычкам'), ('Улучшить кожу и пищеварение', 'почувствовать лёгкость без диет')]),
    dict(t='cards', id='inside', tag='Что внутри', h='Что внутри', sub='Превью разворотов', per=4, note='разделы сборника, количество страниц и 3–4 разворота для превью',
         items=[dict(title=t, text=d, photo='Разворот', wide=1) for t, d in [('Утренние шоты', '[N] рецептов'), ('Смузи', '[N] рецептов'), ('Как и когда пить', 'Схемы на неделю'), ('[Раздел]', '[описание]')]]),
    dict(t='points', tag='Результат', soft=1, h='Почему сборник работает', per=4, items=[('Ускоряют метаболизм', ''), ('Дают естественную энергию', 'без кофе'),
         ('Поддерживают пищеварение', 'и уменьшают вздутие'), ('Спокойное утро', 'осознанный ритуал на 2 минуты')]),
    about('Это формулы, проверенные временем и практикой: шоты и смузи, которые я сама готовлю каждое утро.', 'Алина с утренним смузи'),
    dict(t='reviews', tag='Отзывы', h='Отзывы', note='есть ли отзывы о Detox, на текущей странице блок пустой'),
    dict(t='price', tag='Цена и формат', h='Стоимость', items=[dict(title='Сборник Detox, PDF', price='1 399 ₽', old='1 699 ₽', bullets=['35+ рецептов', 'Бессрочный доступ', 'Ссылка на почту за 15 минут'], btn='Купить сборник', product='Detox', dark=1)]),
    dict(t='faq', tag='FAQ', h='Вопросы о сборнике', q=FAQ_STD + [['Можно ли пить шоты при беременности и проблемах с ЖКТ?']]),
    others('Detox'),
])
SPEC['selfbody.html'] = ('SELFBODY', 'Интенсив 21 день', [
    dict(t='hero', tag='Первый экран', eyebrow='Интенсив от @mrs.alinaas', h='SELFBODY: 21 день, и ты в теле, которое тебе нравится',
         sub='Пошаговая система: здоровые привычки, тренировки и питание. Без перегруза, без срывов, без «надо»',
         bullets=['Старт потока: [дата]', 'Тренировки дома, в зале или на улице', 'Приложение, чат участниц, нутрициолог'], price='4 990 ₽', old='6 990 ₽',
         buy=('SELFBODY', '4 990 ₽', 'Присоединиться'), btn2=('Программа', '#program'), photo='Фото Алины в спортивной форме', src='../img/p-selfbody.webp',
         note='дата следующего потока или старт в любой день; актуальная цена'),
    dict(t='points', tag='Знакомо?', soft=1, h='Хочешь привести тело в форму, но…', per=4, items=[('Тренируешься без плана', 'не знаешь, какие упражнения подходят тебе'),
         ('В питании хаос', 'путаешься в КБЖУ, сложно соблюдать систему'), ('Нет времени', 'не получается выкроить час для себя'), ('Мотивации на пару дней', 'потом срыв и всё сначала')]),
    dict(t='fit', tag='Для кого', h='Подойдёт ли тебе интенсив', yes=['Подтянуть тело или сбросить вес', 'Избавиться от отёков и улучшить качество тела', 'Заниматься дома, в зале или на улице',
         'Устала от срывов и жёстких марафонов', 'Систему, которой будешь следовать и после'], no=['Есть серьёзные противопоказания', 'Ищешь «волшебную таблетку»', 'Не готова уделять себе 30 минут в день']),
    dict(t='points', tag='Результат', h='Что ты получишь за 21 день', per=4, items=[('Минус 2–5 кг', 'подтвердить формулировку'), ('Питание под свою цель', 'без подсчёта калорий до стресса'),
         ('Первые результаты в зеркале', 'и первые фото «до/после»'), ('Качество тела', 'меньше отёков и вздутия'), ('Привычка двигаться', 'и заботиться о теле'),
         ('Режим без стресса', 'в который легко войти'), ('План на месяц после', 'никаких «а что дальше?»'), ('Уверенность в себе', 'главный результат')]),
    dict(t='program', id='program', tag='Программа', h='Что внутри программы', items=[('Тренировки', ['Программы для дома и зала', 'Подробная техника, подходит новичкам', 'Рекомендации по инвентарю', 'Ежедневная зарядка', 'Вакуум, асаны, массаж пресса']),
         ('Питание', ['Система питания под себя', 'Расчёт БЖУ под цель', 'Конструктор тарелки', 'Примеры моих рационов', 'Отчёты и обратная связь нутрициолога']),
         ('Привычки', ['Утренняя и вечерняя рутина', 'Работа с отёками: комплексы и напитки', 'Самомассаж лица', 'Чек-листы, подкасты, подборки', 'Мини-челленджи для мотивации'])]),
    dict(t='points', tag='Как проходит', h='Формат участия', per=4, note='в каком приложении проходит интенсив, кто куратор и нутрициолог',
         items=[('Мобильное приложение', 'вся программа в телефоне, доступ 30 дней + продление'), ('Закрытый чат', 'поддержка и мотивация каждый день'), ('Нутрициолог', 'обратная связь и ответы на вопросы'), ('Розыгрыш призов', 'за лучшие результаты')]),
    dict(t='about', tag='Автор программы', h='Алина, эксперт в питании и тренировках', text='Моё тело — результат многих лет труда и дисциплины. В программе объединяю движение без насилия, питание без заскоков и поддержку.', photo='Портрет Алины'),
    dict(t='reviews', tag='Результаты участниц', h='Результаты участниц', label='Фото «до/после» + отзыв', note='согласие участниц на публикацию фото «до/после»'),
    dict(t='price', tag='Тариф', h='Стоимость участия', items=[dict(title='SELFBODY, 21 день', price='4 990 ₽', old='6 990 ₽', bullets=['Доступ ко всей программе в приложении', 'Готовая система тренировок на 3 недели',
         'Питание без жёстких ограничений', 'Закрытый чат и нутрициолог', 'Доступ 30 дней + возможность продления'], btn='Купить', product='SELFBODY', dark=1, small='Можно оплатить частями')]),
    dict(t='faq', tag='FAQ', h='Ответы на частые вопросы', btn='Написать в поддержку', q=[['А если совсем нет времени?', 'Даже 15–20 минут — это вклад в себя. Интенсив подстраивается под твой ритм.'],
         ['Обязательно ходить в зал?'], ['Я новичок, подойдёт?'], ['У меня нет силы воли, вечно всё бросаю'], ['А если есть проблемы со здоровьем?'], ['Что делать, если не пришёл доступ?']]),
])
SPEC['spasibo.html'] = ('Спасибо за покупку', 'Страница после оплаты', [
    dict(t='thanks', tag='Подтверждение', h='Спасибо за покупку! 🤍', sub='Ссылка придёт на почту, которую вы указали при оплате, в течение 15 минут.',
         note='одна страница для всех продуктов или своя для каждого'),
    dict(t='steps', tag='Что дальше', h='Что дальше', items=[('Проверьте почту', 'Письмо придёт в течение 15 минут'), ('Нет письма?', 'Загляните в «Спам» и «Промоакции»'),
         ('Остались вопросы', 'Напишите в отдел заботы')]),
    dict(t='cta', tag='Закрытый Telegram-канал', h='Присоединяйтесь к каналу', sub='Рецепты, которых нет в Instagram, и общение с Алиной', btn='Вступить в канал'),
    dict(t='cards', tag='Дополните покупку', h='Вам может понравиться', per=3, items=[x for x in ALL if x['title'] in ('Alina CookBook', 'Detox', 'SELFBODY')]),
])
SPEC['oferta.html'] = ('Документы', 'Оферта и политика конфиденциальности', [
    dict(t='doc', tag='Текстовая страница', h='Договор публичной оферты', sub='Редакция от [дата]', note='актуальные тексты оферты и политики',
         parts=['1. Общие положения', '2. Предмет договора', '3. Порядок оплаты и доступа', '4. Возврат', '5. Реквизиты: ИП Васильева Алина Маратовна, ИНН 502725055928']),
])

for fname, (title, desc, blocks) in SPEC.items():
    with open(os.path.join(OUT, fname), 'w') as f:
        f.write(page(fname, title, blocks, desc))
print('pages:', len(SPEC))
