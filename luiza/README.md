# Luiza Event: прототип шаблона страницы кейса

Первый вариант шаблона страницы кейса для luizaevent.ru по ТЗ (Tilda CMS, Zero Block).
Пример наполнения: кейс «Илья и Елизавета», https://luizaevent.ru/ilya_and_elizabeth

- `site/index.html`: разметка шаблона. У элементов, связанных с полями потока, есть `data-field`;
  пустое поле прячет свой элемент (в Тильде видимость «Указано»).
- `site/case.js`: данные поста, ключи совпадают с полями потока из ТЗ.
- `site/app.js`: подстановка полей, курсор «Смотреть», анимация букв меню, появление с увеличением, лайтбокс.
- Кнопка «Поля CMS» в шапке подписывает, какое поле потока стоит за каждым элементом.
- `source/`: тексты и фото кейса, их собирает `scripts/luiza-fetch.mjs` на раннере GitHub
  (из контейнера разработки сайт закрыт). Фото ужаты до 2000 px и лежат в `site/img`.

Деплой: workflow `.github/workflows/luiza-case.yml` публикует `site/` и фото на Cloudflare Pages,
проект `luiza-case`. Нужны секреты репозитория `CLOUDFLARE_API_TOKEN` (права Cloudflare Pages: Edit)
и `CLOUDFLARE_ACCOUNT_ID`. Локально: `python3 -m http.server -d luiza/site`.

Без секретов, через Cloudflare Workers с подключённым репозиторием (настройки в `wrangler.jsonc` в корне):
Workers & Pages → Create → Import a repository → `slmnsrrbk/nerudka`, Project name `luiza-case`,
Build command пустая, Deploy command `npx wrangler deploy`,
Preview command `npx wrangler versions upload`. После создания: Settings → Build → Branch control →
Production branch `claude/cloudflare-page-variant-f0lfc1`.

Проверка деплоя: в сборке Cloudflare должна стоять ветка `claude/cloudflare-page-variant-f0lfc1`,
а в логе шага Deploying строка про 40 файлов из `luiza/site`. Кнопка Retry build повторяет
старую сборку с её веткой, новую сборку запускает пуш в production-ветку.
