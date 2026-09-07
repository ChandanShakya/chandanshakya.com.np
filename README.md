# Chandan Shakya — Portfolio & Blog

Personal site of Chandan Shakya, a Full Stack Web Developer from Kathmandu, Nepal. Plain static HTML, no frameworks on the client, system fonts only.

## What's inside

- Brutalist text-first design, light/dark theme with OS preference + toggle
- Project list with category filter and commit counts
- Blog with syntax highlighting, Disqus comments, RSS feed
- Resume as a direct PDF download, contact form via Formspree
- Sitemap, canonical URLs, meta/OG tags

## Tech

Astro 7 (static output), hand-written CSS, Shiki, Formspree, Disqus. No Tailwind, no client JS framework, no images.

## Run it

```bash
bun install
bun dev        # http://localhost:4321
bun run build  # static output in dist/
```

## Layout

```
├── public/          favicon, resume PDF, headers, redirects
├── src/
│   ├── components/  Header, About, ContactForm, Footer, etc.
│   ├── content/     blog + project markdown
│   ├── layouts/     Base, Post, Project
│   ├── lib/         constants, date/sort helpers
│   ├── pages/       routes (home, blog, projects, archive, 404, rss)
│   └── styles/      one global.css
└── astro.config.mjs
```

Personal project — all rights reserved.
