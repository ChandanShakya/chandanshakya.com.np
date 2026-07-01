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
    quality: 80,
    format: ['webp'],
  },
  build: {
    inlineStylesheets: 'always',
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
});
