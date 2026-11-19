# Task 2 Report: Inline CSS and install metadata

## Changes

- Set `build.inlineStylesheets` to `always` in `astro.config.mjs` so Astro inlines global and scoped component CSS.
- Added `public/manifest.webmanifest` with:
  - `name`: `Chandan Shakya`
  - `short_name`: `Chandan`
  - `start_url`: `/`
  - `display`: `standalone`
  - `theme_color`: `#111111`
  - `background_color`: `#ffffff`
- Derived `public/apple-touch-icon.png` at 180x180 pixels from the existing `public/favicon.svg`; no logo or design was introduced.
- Linked the manifest and Apple touch icon in `src/layouts/BaseLayout.astro`.
- Changed speculation-rule route patterns to `/projects/*/` and `/blog/*/` to match the configured trailing-slash routes.
- Did not modify `public/_headers`, page links, page content, or visual design.

## Baseline evidence

Before the Task 2 changes, `npm run build` produced:

- `external_css_links=1`
- `css_files=1`
- External stylesheet reference: `/_astro/index.B8MjCvS_.css`

The external file represented scoped `CommitsChart` CSS, while global CSS was already inline.

## Verification

Ran `npm run build` after the changes.

Results:

- Build completed successfully with 63 pages.
- `external_css_links=0`
- `css_files=0`
- `dist/index.html` contains 2 inline `<style>` tags.
- Inline homepage CSS includes both global rules and scoped `CommitsChart` rules.
- Homepage content includes `Skip to content`, project links, and the commit chart.
- Homepage contains `<link rel="manifest" href="/manifest.webmanifest">`.
- Homepage contains `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`.
- `dist/manifest.webmanifest` matches the requested name, short name, start URL, display, and colors.
- `git diff --exit-code -- public/_headers` passed, proving `_headers` was untouched.

## Git scope

Task 2 files:

- `astro.config.mjs`
- `src/layouts/BaseLayout.astro`
- `public/manifest.webmanifest`
- `public/apple-touch-icon.png`
- `.superpowers/sdd/2026-11-19-seo-speed-plan/task-2-report.md`
