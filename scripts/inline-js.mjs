// Встраивает бандл скрипта прямо в HTML, чтобы прототип работал при открытии
// файла двойным кликом (file://, где внешние модули блокируются браузером).
// Запуск: node scripts/relativize.mjs && node scripts/inline-js.mjs [dir]
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const DIR = resolve(process.argv[2] ?? 'dist-portable');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const all = await walk(DIR);
const bundles = new Map();
for (const file of all.filter((f) => f.endsWith('.js'))) {
  bundles.set(file.split('/').pop(), await readFile(file, 'utf8'));
}

let patched = 0;
for (const file of all.filter((f) => f.endsWith('.html'))) {
  let html = await readFile(file, 'utf8');
  const before = html;
  html = html.replace(/<script type="module" src="([^"]+)"><\/script>/g, (match, src) => {
    const code = bundles.get(src.split('/').pop());
    if (!code) return match;
    return `<script type="module">\n${code}\n</script>`;
  });
  if (html !== before) {
    await writeFile(file, html);
    patched += 1;
  }
}
console.log(`Скрипт встроен в ${patched} страниц из ${all.filter((f) => f.endsWith('.html')).length}`);
