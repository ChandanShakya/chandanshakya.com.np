#!/usr/bin/env bun
/**
 * update-stats.mjs
 *
 * Keeps portfolio numbers fresh automatically. Single phase:
 *
 * PHASE 1 — per-project commit counts
 *   For every project in src/content/projects/*.md, reads the `link`
 *   frontmatter (GitHub URL) and updates the `commits` field with your
 *   live commit count in that repo. Counts never decrease (max guard)
 *   to avoid GitHub search-index flicker.
 *
 * Required env: GH_STATS_TOKEN — a fine-grained PAT with contents
 * read-only access, limited to the listed repos and the NCCSSoftware
 * organization.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const AUTHOR = 'ChandanShakya';
const TOKEN = process.env.GH_STATS_TOKEN;

if (!TOKEN) {
  console.error('GH_STATS_TOKEN is not set');
  process.exit(1);
}

const headers = {
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
};

async function searchCommitCount(query) {
  const res = await fetch(
    `https://api.github.com/search/commits?q=${encodeURIComponent(query)}&per_page=1`,
    { headers }
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.total_count ?? 0;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// PHASE 1 — refresh `commits` frontmatter (per-repo isolation)
// ---------------------------------------------------------------------------
const projectsDir = 'src/content/projects';
const files = readdirSync(projectsDir).filter((f) => f.endsWith('.md'));

let tracked = 0;
let failed = 0;

for (const file of files) {
  const path = join(projectsDir, file);
  try {
    const content = readFileSync(path, 'utf8');
    const m = content.match(
      /^link:\s*"?(https:\/\/github\.com\/([^"/\s]+)\/([^"/\s#?]+?))(?:\.git)?"?\s*$/m
    );
    if (!m) {
      console.log(`skip ${file}: no GitHub link in frontmatter`);
      continue;
    }
    const repo = `${m[2]}/${m[3]}`;
    const count = await searchCommitCount(`author:${AUTHOR} repo:${repo}`);
    await sleep(2500); // stay well under the 30 req/min search rate limit

    const oldMatch = content.match(/^commits:\s*(\d+)\s*$/m);
    const oldCount = oldMatch ? parseInt(oldMatch[1], 10) : 0;
    if (oldCount > 0 && count > oldCount * 3) {
      console.warn(
        `verify ${repo}: count jump ${oldCount} -> ${count} (>3x), check manually`
      );
    }
    const next = Math.max(oldCount, count);

    const updated = content.replace(/^commits:\s*\d+\s*$/m, `commits: ${next}`);
    if (updated !== content) {
      writeFileSync(path, updated);
      console.log(`${repo}: commits -> ${next}`);
    } else {
      console.log(`${repo}: ${next} (unchanged)`);
    }
    tracked++;
  } catch (err) {
    failed++;
    console.error(`skip ${file}: ${err.message}`);
    continue;
  }
}

console.log(`Done: ${tracked} updated, ${failed} failed (${files.length} total)`);

if (files.length > 0 && failed >= files.length) {
  console.error('All repos failed, exiting nonzero');
  process.exit(1);
}
