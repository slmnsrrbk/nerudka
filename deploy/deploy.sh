#!/usr/bin/env bash
# Деплой прототипа на сервер. Запускать НА СВОЁМ КОМПЬЮТЕРЕ из корня проекта:
#   bash deploy/deploy.sh
#
# Переменные окружения (можно переопределить):
#   HOST    адрес сервера           по умолчанию из аргумента или спросит
#   USER    пользователь            по умолчанию root
#   TARGET  каталог на сервере      по умолчанию /var/www/beton-prototype
set -euo pipefail

HOST="${HOST:-${1:-}}"
USER="${USER:-root}"
TARGET="${TARGET:-/var/www/beton-prototype}"

if [ -z "$HOST" ]; then
  read -rp "Адрес сервера (IP или домен): " HOST
fi

echo "==> Собираю прототип"
npm ci
npm run build
npm run check:links

echo "==> Заливаю на $USER@$HOST:$TARGET"
# --delete чистит только целевой каталог прототипа, ничего рядом не трогает.
rsync -az --delete --human-readable --progress dist/ "$USER@$HOST:$TARGET/"

echo "==> Перезагружаю nginx"
ssh "$USER@$HOST" "nginx -t && systemctl reload nginx"

echo
echo "Готово. Проверьте: http://$HOST/"
