// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Прототип. Домен условный, меняется вместе с данными в src/data/site.json.
export default defineConfig({
  site: 'https://beton-prototype.local',
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
