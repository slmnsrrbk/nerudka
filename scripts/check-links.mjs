// Проверка внутренних ссылок в собранном прототипе.
// Запуск: npm run build && npm run check:links
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST = resolve('dist');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function targetsFor(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return [join(DIST, 'index.html')];
  const rel = clean.replace(/^\//, '');
  if (clean.endsWith('/')) return [join(DIST, rel, 'index.html')];
  return [join(DIST, rel), join(DIST, rel, 'index.html'), join(DIST, `${rel}.html`)];
}

const files = await walk(DIST);
const broken = new Map();
let checked = 0;

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    checked += 1;
    if (targetsFor(href).some((t) => existsSync(t))) continue;
    const page = file.replace(DIST, '') || '/index.html';
    if (!broken.has(href)) broken.set(href, new Set());
    broken.get(href).add(page);
  }
}

console.log(`Страниц: ${files.length}, проверено внутренних ссылок: ${checked}`);
if (broken.size === 0) {
  console.log('Битых внутренних ссылок нет.');
  process.exit(0);
}
console.log(`Битых ссылок: ${broken.size}`);
for (const [href, pages] of broken) {
  console.log(`  ${href}  <- ${[...pages].slice(0, 3).join(', ')}`);
}
process.exit(1);
