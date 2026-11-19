import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures = [];
const routePattern = /^\/(?:$|(?:[^/?#]+\/)*[^/?#]+)$/;
const fileExtensions = /\.(?:astro|ts|mjs|txt|xml)$/;

function filesIn(path) {
  return readdirSync(path).flatMap((name) => {
    const file = join(path, name);
    return statSync(file).isDirectory() ? filesIn(file) : [file];
  });
}

function checkUrl(value, file, kind) {
  if (!routePattern.test(value) || value === '/' || value.endsWith('/')) return;
  if (/\.[a-z0-9]+$/i.test(value)) return;
  failures.push(`${relative(root, file)}: ${kind} lacks trailing slash: ${value}`);
}

for (const dir of ['src', 'public']) {
  for (const file of filesIn(join(root, dir))) {
    if (!fileExtensions.test(file) && !file.endsWith('_redirects')) continue;
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/href=["'](\/[^"'#?]+)["']/g)) checkUrl(match[1], file, 'href');
    for (const match of source.matchAll(/`((?:https:\/\/chandanshakya\.com\.np)?\/(?:blog|projects|archive)(?:\/[^`'" ]*)?)`/g)) {
      const pathname = match[1].replace('https://chandanshakya.com.np', '');
      if (!pathname.includes('${')) checkUrl(pathname, file, 'URL');
    }
    for (const match of source.matchAll(/(?:url|item|link|href):\s*`([^`]+)`/g)) {
      const absolute = match[1].match(/^https:\/\/chandanshakya\.com\.np(\/.*)$/);
      if (absolute) checkUrl(absolute[1], file, 'URL');
    }
  }
}

const dist = join(root, 'dist');
try {
  for (const file of filesIn(dist).filter((file) => file.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');
    const encodedTitle = html.match(/<title>(.*?)<\/title>/s)?.[1];
    const title = encodedTitle?.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    const isHomepage = relative(dist, file) === 'index.html';
    if (title && !isHomepage && title.length > 60) failures.push(`${relative(root, file)}: title exceeds 60 characters (${title.length})`);
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const url = match[1];
      if (url.startsWith('/') && !url.startsWith('//')) checkUrl(url.split(/[?#]/, 1)[0], file, 'href');
    }
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
