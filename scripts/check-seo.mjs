import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const failures = [];
const homepageTitle = 'Chandan Shakya — Full Stack Web Developer | Laravel, Livewire & PHP';
const sourceExtensions = /\.(?:astro|ts|mjs|txt|xml|html|yml|yaml)$/;

function filesIn(path) {
  return readdirSync(path).flatMap((name) => {
    const file = join(path, name);
    return statSync(file).isDirectory() ? filesIn(file) : [file];
  });
}

function decodeHtml(value) {
  return value.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function checkUrl(value, file, kind) {
  const [withoutHash] = value.split('#', 1);
  const [pathname] = withoutHash.split('?', 1);
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return;
  if (pathname === '/' || pathname.endsWith('/') || pathname.includes('*')) return;
  if (/\.[a-z0-9]+$/i.test(pathname)) return;
  failures.push(`${relative(root, file)}: ${kind} lacks trailing slash: ${value}`);
}

function pageUrl(file) {
  const path = relative(dist, file).replaceAll('\\', '/');
  if (path === 'index.html') return 'https://chandanshakya.com.np/';
  if (path.endsWith('/index.html')) return `https://chandanshakya.com.np/${path.slice(0, -'index.html'.length)}`;
  return `https://chandanshakya.com.np/${path}`;
}

function outputFile(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\\') || decoded.split('/').includes('..')) return null;

  const relativePath = decoded.startsWith('/') ? decoded.slice(1) : decoded;
  const outputPath = relativePath === '' || relativePath.endsWith('/')
    ? `${relativePath}index.html`
    : relativePath;
  const candidate = resolve(dist, outputPath);
  if (candidate !== dist && !candidate.startsWith(`${dist}${sep}`)) return null;
  return existsSync(candidate) && statSync(candidate).isFile() ? candidate : null;
}

function checkInternalLink(value, file, sourceUrl) {
  let url;
  try {
    url = new URL(value, sourceUrl);
  } catch {
    failures.push(`${relative(root, file)}: malformed href: ${value}`);
    return;
  }
  if (url.origin !== 'https://chandanshakya.com.np') return;

  const target = outputFile(url.pathname);
  if (!target) {
    failures.push(`${relative(root, file)}: internal href target not found: ${value}`);
    return;
  }
  if (!url.hash || !target.endsWith('.html')) return;

  let fragment;
  try {
    fragment = decodeURIComponent(url.hash.slice(1));
  } catch {
    failures.push(`${relative(root, file)}: malformed href fragment: ${value}`);
    return;
  }
  const html = readFileSync(target, 'utf8');
  const anchors = [...html.matchAll(/<[a-z][^>]*>/gi)].flatMap(([tag]) => {
    const isAnchor = /^<a(?:\s|>)/i.test(tag);
    const values = [];
    const pattern = isAnchor
      ? /\s(?:id|name)\s*=\s*(["'])(.*?)\1/gi
      : /\sid\s*=\s*(["'])(.*?)\1/gi;
    for (const match of tag.matchAll(pattern)) values.push(decodeHtml(match[2]));
    return values;
  });
  if (!anchors.includes(fragment)) {
    failures.push(`${relative(root, file)}: internal href fragment not found: ${value}`);
  }
}

function internalUrl(value) {
  if (value.includes('${')) return null;
  const absolute = value.match(/^https:\/\/chandanshakya\.com\.np(\/[^\s]*)$/);
  if (absolute) return absolute[1];
  return value.startsWith('/') && !value.startsWith('//') ? value : null;
}

function checkSource(source, file) {
  const literal = /(["'`])((?:https:\/\/chandanshakya\.com\.np)?\/[\s\S]*?)\1/g;
  for (const match of source.matchAll(literal)) {
    const pathname = internalUrl(match[2]);
    if (pathname) checkUrl(pathname, file, 'URL');
  }

  for (const match of source.matchAll(/(?:href|url|item|link|redirect)\s*(?:=|:)\s*\{?\s*(["'`])([^"'`]*?)\1/g)) {
    const pathname = internalUrl(match[2]);
    if (pathname) checkUrl(pathname, file, match[0].split(/[=:]/, 1)[0]);
  }

  if (file.endsWith('_redirects')) {
    for (const line of source.split('\n')) {
      if (!line.trim() || line.trimStart().startsWith('#')) continue;
      for (const target of line.trim().split(/\s+/).slice(1, 2)) {
        const pathname = internalUrl(target);
        if (pathname) checkUrl(pathname, file, 'redirect');
      }
    }
  }
}

for (const dir of ['src', 'public']) {
  for (const file of filesIn(join(root, dir))) {
    if (!sourceExtensions.test(file) && !file.endsWith('_redirects')) continue;
    checkSource(readFileSync(file, 'utf8'), file);
  }
}

try {
  let homepageTitleCount = 0;
  for (const file of filesIn(dist).filter((file) => file.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    const sourceUrl = pageUrl(file);
    const title = decodeHtml(html.match(/<title>(.*?)<\/title>/s)?.[1] ?? '');
    const isHomepage = relative(dist, file) === 'index.html';
    if (isHomepage && title !== homepageTitle) {
      failures.push(`${relative(root, file)}: homepage title mismatch: ${JSON.stringify(title)}`);
    }
    if (title === homepageTitle) homepageTitleCount += 1;
    if (!isHomepage && title.length > 60) {
      failures.push(`${relative(root, file)}: title exceeds 60 characters (${title.length})`);
    }
    for (const match of html.matchAll(/href\s*=\s*(["'])(.*?)\1/gi)) {
      const href = decodeHtml(match[2]);
      const pathname = internalUrl(href);
      if (pathname) checkUrl(pathname, file, 'href');
      checkInternalLink(href, file, sourceUrl);
    }
  }
  if (homepageTitleCount !== 1) {
    failures.push(`generated HTML: homepage title count is ${homepageTitleCount}, expected 1`);
  }
  const index = readFileSync(join(dist, 'index.html'), 'utf8');
  const encodedIndexTitle = index.match(/<title>(.*?)<\/title>/s)?.[1] ?? '';
  if (encodedIndexTitle.length !== 71) {
    failures.push(`generated homepage title length is ${encodedIndexTitle.length}, expected 71`);
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  failures.push('dist/: build output not found');
}

if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`Found ${failures.length} violation${failures.length === 1 ? '' : 's'}.`);
  process.exitCode = 1;
} else {
  console.log('SEO regression check passed.');
}
