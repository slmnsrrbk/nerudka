// Делает ссылки в собранном прототипе относительными, чтобы dist можно было
// открыть с любого базового пути (хостинг в подпапке, artifact, статика без сервера).
// Запуск: npm run build && node scripts/relativize.mjs [outDir]
import { cp, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const SRC = resolve('dist');
const OUT = resolve(process.argv[2] ?? 'dist-portable');

// Хостинги артефактов резервируют имена с подчёркиванием в начале.
const RENAMES = [
  ['_astro', 'assets'],
  ['_prototype', 'karta-prototipa'],
];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function resolveTarget(href) {
  const [pathPart, hash = ''] = href.split('#');
  const clean = pathPart.replace(/^\//, '');
  const suffix = hash ? `#${hash}` : '';
  if (clean === '') return { target: 'index.html', suffix };
  if (pathPart.endsWith('/')) return { target: `${clean}index.html`, suffix };
  if (existsSync(join(OUT, clean))) return { target: clean, suffix };
  if (existsSync(join(OUT, clean, 'index.html'))) return { target: `${clean}/index.html`, suffix };
  return { target: clean, suffix };
}

if (existsSync(OUT)) await rm(OUT, { recursive: true });
await cp(SRC, OUT, { recursive: true });

for (const [from, to] of RENAMES) {
  if (existsSync(join(OUT, from))) await rename(join(OUT, from), join(OUT, to));
}

const files = (await walk(OUT)).filter((f) => f.endsWith('.html'));
let rewritten = 0;

for (const file of files) {
  const fromDir = dirname(file);
  let html = await readFile(file, 'utf8');
  for (const [from, to] of RENAMES) html = html.split(`/${from}/`).join(`/${to}/`);
  html = html.replace(/(href|src)="(\/[^"]*)"/g, (match, attr, href) => {
    if (href.startsWith('//')) return match;
    const { target, suffix } = resolveTarget(href);
    let rel = relative(fromDir, join(OUT, target)).split(sep).join('/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    rewritten += 1;
    return `${attr}="${rel}${suffix}"`;
  });
  await writeFile(file, html);
}

console.log(`Файлов обработано: ${files.length}, ссылок переписано: ${rewritten}`);
console.log(`Результат: ${OUT}`);
