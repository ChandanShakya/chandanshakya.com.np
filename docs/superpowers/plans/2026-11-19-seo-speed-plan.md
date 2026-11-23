# SEO and Speed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Remove redirect hops, shorten metadata, inline all page CSS, add edge caching and installable metadata, and prove links/performance before PR.

**Architecture:** Keep Astro static generation. Normalize URLs with Astro `trailingSlash: "always"`, force stylesheet inlining, update authored links and JSON-LD, then configure Cloudflare Pages/cache separately. Verify built output before deployment.

**Tech Stack:** Astro 7.3.1, Cloudflare Pages, Bun, Browser/Brave DevTools, GitHub MCP.

**Spec:** User request in current conversation (approved execution scope).

## Global Constraints
- Work only on `fix/seo-speed-perfection`; never push or merge `main`.
- Do not change visual design, body copy, content, dates, or slugs.
- Keep Disqus lazy load, Formspree, RSS, llms.txt, sitemap lastmod, and speculation rules.
- Homepage title stays `Chandan Shakya — Full Stack Web Developer | Laravel, Livewire & PHP`.
- Individual content descriptions remain unless outside 50–160 characters.
- No external fonts, analytics, JS, or invented images.
- Report only measured evidence.

## Review Focus
- Static Pages trailing-slash behavior depends on host; test generated hrefs, canonicals, sitemap, and 200 responses.
- Inlining component CSS may increase each page HTML; verify no external stylesheet and unchanged rendered CSS.
- HTML edge caching must not cache contact submission or dynamic endpoints; inspect scope and response.
- External links can rate-limit; document only observed outcomes.
- Cloudflare Pages redirect/domain activation can lag; recheck after propagation.

---

### Task 1: Normalize URLs and SEO metadata

**Files:** Modify `astro.config.mjs`, `src/lib/constants.ts`, `src/components/SEO.astro`, specified Astro pages/layouts/components, plus `src/pages/archive.astro` and `public/_redirects`.
**Interfaces:** Produces slash-normalized internal links and JSON-LD plus short titles/expanded index descriptions.

- [ ] Add a regression script that scans source-built HTML for route hrefs lacking trailing slash and titles over target length.
- [ ] Run it before implementation and record failure.
- [ ] Set `trailingSlash: "always"` and update all route hrefs/JSON-LD/redirect targets.
- [ ] Split short SITE suffix from full homepage title; preserve full title only on homepage.
- [ ] Set homepage/blog/projects descriptions to unique 120–155 character copy.
- [ ] Build and run regression checks; require zero violating internal routes and metadata limits.

### Task 2: Inline CSS and polish install metadata

**Files:** Modify `astro.config.mjs`, `src/layouts/BaseLayout.astro`; create manifest, apple-touch icon from existing site asset.
**Interfaces:** Consumes normalized BaseLayout; produces no external CSS and linked manifest/icon.

- [ ] Build baseline and retain evidence of one external CSS link.
- [ ] Set Astro stylesheet inlining so shared and component CSS stay inline.
- [ ] Add manifest and derived apple-touch icon without changing logo/design.
- [ ] Preserve speculation rules and update route pattern if needed.
- [ ] Build and require zero external `/_astro/*.css` links.

### Task 3: Edge caching and headers

**Files:** Modify `public/_headers` (not unrelated headers). Cloudflare cache rule handled through API.
**Interfaces:** Produces immutable assets and safe static HTML edge cache.

- [ ] Add explicit static HTML caching only if verified safe by deployed response behavior.
- [ ] Do not cache contact, API, or dynamic endpoints.
- [ ] Document exact header/rule, ID, TTL, purge consequences.
- [ ] Verify warm apex, blog, projects responses, TTFB, and HIT status.

### Task 4: End-to-end audit and PR

**Files:** No content changes except fixes found; PR/report artifacts if needed.

- [ ] Install frozen deps and build from clean state.
- [ ] Verify generated titles/descriptions, hrefs, sitemap lastmod/RSS/llms/404/redirects.
- [ ] Crawl all sitemap URLs plus internal/external links and summarize counts.
- [ ] Run cold/warm curl measurements for required pages.
- [ ] Run Brave and PageSpeed checks for live/deployed preview when available.
- [ ] Review whole branch, commit, push feature branch, open PR with measured before/after report.
