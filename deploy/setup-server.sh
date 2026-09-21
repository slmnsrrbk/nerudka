#!/usr/bin/env bash
# Первичная настройка сервера под прототип. Запускать НА СЕРВЕРЕ один раз.
#   bash setup-server.sh
set -euo pipefail

TARGET="${TARGET:-/var/www/beton-prototype}"

echo "==> Ставлю nginx, если его нет"
if ! command -v nginx >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y nginx
fi

echo "==> Готовлю каталог $TARGET"
mkdir -p "$TARGET"
chown -R www-data:www-data "$TARGET"

echo "==> Подключаю конфиг"
cp nginx-beton-prototype.conf /etc/nginx/sites-available/beton-prototype
ln -sf /etc/nginx/sites-available/beton-prototype /etc/nginx/sites-enabled/beton-prototype
# Дефолтный сайт мешает, если server_name не задан.
rm -f /etc/nginx/sites-enabled/default

echo "==> Проверяю конфиг и перезагружаю nginx"
nginx -t
systemctl reload nginx

echo
echo "Готово. Каталог сайта: $TARGET"
echo "Залейте туда содержимое папки dist и открывайте сайт по IP сервера."
