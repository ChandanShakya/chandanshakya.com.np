// Astro copies each source image untouched into dist/_astro even when only
// resized variants are used. Delete any image there that nothing references,
// so full-size originals (and their EXIF/GPS data) are never deployed.
import { readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const assets = join(dist, '_astro');
const imageExt = /\.(?:jpe?g|png|webp|avif|gif|tiff?)$/i;
const textExt = /\.(?:html|css|js|mjs|json|xml|txt|webmanifest)$/i;

function filesIn(path) {
  return readdirSync(path).flatMap((name) => {
    const file = join(path, name);
    return statSync(file).isDirectory() ? filesIn(file) : [file];
  });
}

let all;
try {
  all = filesIn(assets);
} catch {
  process.exit(0); // no _astro dir, nothing to prune
}

const corpus = filesIn(dist)
  .filter((f) => textExt.test(f))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n');

let removed = 0;
let bytes = 0;
for (const file of all.filter((f) => imageExt.test(f))) {
  const name = file.slice(file.lastIndexOf('/') + 1);
  if (corpus.includes(name)) continue;
  bytes += statSync(file).size;
  rmSync(file);
  removed += 1;
}
console.log(`Pruned ${removed} unreferenced image(s) from dist/_astro (${(bytes / 1048576).toFixed(1)} MB).`);
