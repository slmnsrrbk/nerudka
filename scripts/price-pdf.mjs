// Собирает PDF прайс-листа из страницы /price/print/ (запускать после `astro build`).
// Результат: public/price.pdf (хранится в репозитории) и dist/price.pdf (уходит в публикацию).
// Обновлять после изменения цен: npm run price-pdf.
import { createServer } from 'node:http';
import { readFile, copyFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const dist = new URL('../dist/', import.meta.url).pathname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  if (p.endsWith('/')) p += 'index.html';
  let body;
  try { body = await readFile(join(dist, p)); } catch { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
  res.end(body);
}).listen(0);
const { port } = server.address();

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/price/print/`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const out = new URL('../public/price.pdf', import.meta.url).pathname;
await page.pdf({
  path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true, headerTemplate: '<span></span>',
  footerTemplate: `<div style="width:100%;padding:0 12mm;font:8px sans-serif;color:#8E98B4;display:flex;justify-content:space-between">
    <span>Прайс-лист · бетон и растворы с завода</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
});
await browser.close();
server.close();
await copyFile(out, join(dist, 'price.pdf'));
console.log(`Прайс PDF: public/price.pdf, ${((await stat(out)).size / 1024).toFixed(0)} КБ`);
