// Перед сборкой: скачивает видео первого экрана (Higgsfield, Kling 3.0) в public/video/hero.mp4.
// Из среды разработки CDN может быть недоступен — тогда сборка идёт дальше, а на главной остаётся фото.
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const cfg = JSON.parse(readFileSync(new URL('../src/data/hero-video.json', import.meta.url), 'utf8'));
const out = new URL('../public/video/hero.mp4', import.meta.url);
if (!cfg.url) { console.log('[hero-video] ссылка не задана — пропускаю'); process.exit(0); }
if (existsSync(out)) { console.log('[hero-video] уже есть'); process.exit(0); }
try {
  const res = await fetch(cfg.url, { signal: AbortSignal.timeout(90_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(new URL('../public/video/', import.meta.url), { recursive: true });
  writeFileSync(out, buf);
  console.log(`[hero-video] скачано ${(buf.length / 1048576).toFixed(1)} МБ`);
} catch (e) {
  console.warn(`[hero-video] не удалось скачать (${e.message}) — на главной останется фото`);
}
