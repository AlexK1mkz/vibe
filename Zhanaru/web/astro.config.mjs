import { defineConfig } from 'astro/config';
// Островки написаны на React, но в браузер уходит Preact (preact/compat): ~10 раз легче рантайм.
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Домен пока не утверждён (см. TODO-CONTENT.md). Меняется здесь или через SITE_URL.
const site = process.env.SITE_URL || 'https://zhanaru.kz';

export default defineConfig({
  site,
  integrations: [
    preact({ compat: true }),
    sitemap({
      // служебные страницы и непереведённая KZ-версия в карту сайта не попадают
      filter: (page) => !/\/(thanks|404|offer|kk)\/?$/.test(page),
    }),
  ],
  // CSS встраивается в HTML: без отдельного блокирующего запроса первый экран рисуется быстрее
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    // эти пакеты импортируют react: при сборке страниц их нужно пропустить через алиас preact/compat
    ssr: { noExternal: ['zustand', 'lucide-react'] },
  },
});
