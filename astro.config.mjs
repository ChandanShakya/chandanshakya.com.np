import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://chandanshakya.com.np',
  output: 'static',
  integrations: [
    tailwind(),
    sitemap(),
  ],
  image: {
    quality: 'max',
    format: ['webp'],
  },
  build: {
    inlineStylesheets: 'always',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});
