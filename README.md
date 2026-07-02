# Chandan Shakya — Portfolio & Blog

Personal portfolio and blog of Chandan Shakya, a Web Developer, Researcher, and Social Engineer from Kathmandu, Nepal. Built with a Stardew Valley-inspired pixel art aesthetic.

## Features

- Pixel art UI with light/dark themes
- Project showcase with 27+ projects
- Technical blog with syntax highlighting (Shiki)
- PDF resume viewer (PDF.js)
- Contact form (Formspree)
- RSS feed, sitemap, SEO meta tags
- Responsive design, accessible, reduced-motion support

## Tech Stack

- [Astro](https://astro.build/) 7 — static site generator
- [Tailwind CSS](https://tailwindcss.com/) 4 — utility-first styling
- [Shiki](https://shiki.style/) — syntax highlighting
- [PDF.js](https://mozilla.github.io/pdf.js/) — PDF rendering
- [Formspree](https://formspree.io/) — contact form
- [Disqus](https://disqus.com/) — blog comments

## Quick Start

```bash
bun install
bun dev
```

Open `http://localhost:4321` in your browser.

## Build

```bash
bun run build
bun run preview
```

Output is generated in `dist/` as a fully static site.

## Project Structure

```
├── public/              Static assets (images, PDF, headers)
├── src/
│   ├── components/      Astro components (Header, About, ResumeModal, etc.)
│   ├── content/         Blog posts and project markdown files
│   ├── layouts/         Page layouts
│   ├── lib/             Utilities and constants
│   ├── pages/           Route pages
│   └── styles/          Global CSS
└── astro.config.mjs
```

## License

Personal project — all rights reserved.
