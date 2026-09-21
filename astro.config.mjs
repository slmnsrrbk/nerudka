// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Прототип. Адрес берётся из окружения сборки:
// CF_PAGES_URL подставляет Cloudflare Pages, SITE_URL можно задать вручную.
const site = process.env.SITE_URL || process.env.CF_PAGES_URL || 'https://beton-prototype.pages.dev';

export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/_prototype'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
