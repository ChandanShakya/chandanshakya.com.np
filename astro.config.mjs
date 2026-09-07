import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

export default defineConfig({
  site: 'https://chandanshakya.com.np',
  prefetch: {
    defaultStrategy: 'hover',
  },
  integrations: [
    sitemap({
      serialize(item) {
        // Derive lastmod from blog/project content dates (slug matches id)
        const m = item.url.match(/\/(blog|projects)\/([^/]+)\/?$/);
        if (m) {
          const src = readFileSync(`src/content/${m[1]}/${m[2]}.md`, 'utf8');
          const lastmod = src.match(/^updated:\s*(.+)$/m)?.[1] ?? src.match(/^date:\s*(.+)$/m)?.[1];
          if (lastmod) item.lastmod = new Date(lastmod.trim()).toISOString();
        }
        return item;
      },
    }),
  ],
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
