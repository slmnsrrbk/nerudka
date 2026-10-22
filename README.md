# Сайт бетонного завода

Сайт свёрстан по макетам Figma (дизайн «3»). На сайте только страницы, у которых есть макет:

| Страница | Адрес | Макет в Figma |
|---|---|---|
| Главная | `/` | «Концепты главной страницы после правок» → П8 |
| Прайс-лист | `/price/` | «Вариант · 02 · Прайс-лист — вкладка с одной ценой» |
| Каталог | `/catalog/` | «Внутренние страницы · после правок» → «Каталог» |
| Категория и подкатегория | `/catalog/beton/`, `/catalog/beton/tovarnyj/` | «Бетон», «Категория», «Подкатегория» |
| Марка, класс, назначение | `/beton/m300/`, `/beton/dlya-fundament/` | «Подкатегория · марка», «· назначение» |
| Карточка товара | `/catalog/beton/tovarnyj/beton-m300-granit/` | «Товар» |
| О компании | `/o-zavode/` | «О компании» |
| Контакты | `/kontakty/` | «Контакты» |
| Поиск | `/poisk/?q=М300` | «Поиск», «Поиск · ничего не найдено» |
| Корзина | `/korzina/` | «Корзина», «Корзина · пусто» |
| Советы технолога (блог) | `/blog/`, `/blog/priemka-betona/` | шаблон статьи; в меню не выводится, ссылки с главной и из подвала |
| Сертификаты и декларации | `/sertifikaty/` | документы по запросу, номера — [заглушка] |
| Правовые документы (7 страниц) | `/politika/`, `/soglasie/`, `/perechen-personalnyh-dannyh/`, `/instrukciya-ucheta-i-unichtozheniya/`, `/instrukciya-polzovatelya-ispdn/`, `/prikaz-ob-utverzhdenii/`, `/oferta/` | один шаблон, тексты в `src/lib/legal.ts`, данные компании — [заглушка] |

Страницы серого прототипа (услуги, доставка и гео-страницы, калькулятор, сертификаты, проекты, отзывы,
акции, FAQ, юрлицам, карта прототипа, концепты) удалены.
Ссылки на них заменены: услуги ведут к ценам в прайсе (`/price/#uslugi`), доставка — к блоку на главной,
документы открывают форму запроса.

Рабочее название компании: **БетонЗавод**. Контакты, цены и реквизиты условные, неподтверждённое помечено [заглушка].

Код: страницы в `src/pages/`, общий макет `src/layouts/HomeLayout.astro`, компоненты в `src/components/home/`
и `src/components/site/`, стили `src/styles/home.css` и `src/styles/inner.css`, вся клиентская логика в `src/scripts/home.ts`.
Меню «Продукция» собрано по семантическому дереву заказчика (XMind) в `src/lib/menu.ts`.
Данные: `src/data/categories.json`, `products.json`, `purposes.json`, `services.json`, `site.json`.

## Запуск

```bash
npm install
npm run dev        # дев-сервер, http://localhost:4321
npm run build      # сборка в dist/
npm run preview    # просмотр собранного сайта
npm run portable   # копия с относительными ссылками в dist-portable/ (для хостинга в подпапке)
npm run offline    # portable + встроенный скрипт, открывается двойным кликом по index.html
```

## Проверки

```bash
npm run check:links    # битые внутренние ссылки в dist/
npm run check:mobile   # горизонтальный скролл на 375 px и ошибки JS
npm run check:home     # главная: скролл на ширинах 320–2560, ошибки JS, 404
npm run check:home-ui  # мегаменю, мобильное меню, поиск, прайс и корзина, формы, калькулятор, слайдеры
npm run check:inner    # внутренние страницы
```

Кроме `check:links`, проверкам нужен запущенный `npm run preview` (адрес `http://localhost:4321`).

Публикация: проект Cloudflare Workers `luiza-case` подключён к репозиторию, настройки — в `wrangler.jsonc`.

## Публикация для клиента

### Вариант 1: Cloudflare Pages, подключение репозитория (рекомендую)

Секреты и workflow не нужны, каждый пуш деплоится сам.

1. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git
2. Выбрать репозиторий и ветку
3. Параметры сборки:
   - Framework preset: `Astro`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `22` (переменная окружения `NODE_VERSION=22`)
4. Save and Deploy

Адрес будет вида `https://<имя-проекта>.pages.dev`. Canonical подставляется автоматически
из `CF_PAGES_URL`, вручную адрес можно задать переменной `SITE_URL`.

### Вариант 2: GitHub Actions и прямая загрузка

Если проект в Cloudflare уже создан как Direct Upload, добавьте секреты репозитория
`CLOUDFLARE_API_TOKEN` (права Cloudflare Pages: Edit) и `CLOUDFLARE_ACCOUNT_ID`.
Workflow `.github/workflows/deploy-cloudflare.yml` соберёт прототип, проверит ссылки
и задеплоит в проект `beton-prototype`. Без секретов деплой пропускается, сборка всё равно проверяется.

### Вариант 3: свой сервер по SSH

Разовая настройка сервера (выполнить на сервере, файлы из папки `deploy`):

```bash
bash setup-server.sh        # ставит nginx, создаёт /var/www/beton-prototype, включает конфиг
```

Деплой со своего компьютера:

```bash
HOST=адрес-сервера bash deploy/deploy.sh
```

Автодеплой на каждый пуш: workflow `.github/workflows/deploy-jino.yml`.
Секреты репозитория `SSH_HOST`, `SSH_USER`, `SSH_KEY` (приватный ключ целиком),
переменная `SSH_TARGET` при нестандартном каталоге.

Заливается содержимое `dist`, потому что сайт отдаётся с корня домена.
Если прототип живёт в подпапке, заливайте `dist-portable` после `npm run portable`.

### Индексация

`public/robots.txt` содержит `Disallow: /`, а `public/_headers` отдаёт `X-Robots-Tag: noindex`.
Прототип открывается по ссылке, но в поиск не попадает. Перед запуском боевого сайта оба файла нужно поправить.

## Стек

Astro (static) + Tailwind CSS v4. Бэкенда нет: формы показывают сообщение об успехе, корзина лежит в `localStorage`.
Страницы каталога, марок, классов и назначений генерируются из JSON через `getStaticPaths`.
