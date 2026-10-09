#!/usr/bin/env bun
/**
 * update-stats.mjs
 *
 * Keeps portfolio numbers fresh automatically. Two phases:
 *
 * PHASE 1 — per-project commit counts
 *   For every project in src/content/projects/*.md, reads the `link`
 *   frontmatter (GitHub URL) and updates the `commits` field with your
 *   live commit count in that repo. Counts never decrease (max guard)
 *   to avoid GitHub search-index flicker.
 *
 * PHASE 2 — weekly commit history (powers the over-time chart)
 *   For each tracked repo, fetches per-contributor stats and writes
 *   src/data/commit-history.json as:
 *     { generatedAt: <iso>, weeks: [{ week: <unix>, total: <n>,
 *       repos: { <project-slug>: <n> } }] }
 *   Counts are author-scoped (AUTHOR's commits only via
 *   /stats/contributors, matched case-insensitively). Repos where
 *   the author is absent are skipped. Capped to the last 52 weeks.
 *   Per-repo failures skip that repo and never kill the run.
 *
 * Required env: GH_STATS_TOKEN — a fine-grained PAT with contents
 * read-only access, limited to the listed repos and the NCCSSoftware
 * organization.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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

// ---------------------------------------------------------------------------
// PHASE 2 — weekly commit history for the over-time chart (never fatal)
// ---------------------------------------------------------------------------
async function fetchAuthorWeeks(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/stats/contributors`;
  let res = await fetch(url, { headers });
  if (res.status === 202) {
    // GitHub computing stats — wait once, retry once, else skip repo
    await sleep(8000);
    res = await fetch(url, { headers });
    if (res.status === 202) throw new Error('stats computing, try next run');
  }
  if (res.status === 204) return null; // empty repo
  if (res.status === 404) return null; // no stats / no access
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!Array.isArray(data)) return null;
  const mine = data.find(
    (c) => c?.author?.login?.toLowerCase() === AUTHOR.toLowerCase()
  );
  if (!mine || !Array.isArray(mine.weeks)) return null; // author absent
  return mine.weeks;
}

function parseRepoLink(content) {
  const m = content.match(
    /^link:\s*"?(https:\/\/github\.com\/([^"/\s]+)\/([^"/\s#?]+?))(?:\.git)?"?\s*$/m
  );
  return m ? `${m[2]}/${m[3]}` : null;
}

try {
  const perRepo = new Map(); // slug -> Map(week -> count)
  let historyFailed = 0;

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    try {
      const content = readFileSync(join(projectsDir, file), 'utf8');
      const repo = parseRepoLink(content);
      if (!repo) {
        console.log(`history skip ${slug}: no GitHub link`);
        continue;
      }
      const [owner, name] = repo.split('/');
      const authorWeeks = await fetchAuthorWeeks(owner, name);
      await sleep(2500);
      if (!authorWeeks) {
        console.log(`history skip ${slug}: author ${AUTHOR} absent`);
        continue;
      }
      const series = new Map();
      for (const w of authorWeeks) {
        if (w && typeof w.w === 'number' && (w.c || 0) > 0) {
          series.set(w.w, w.c);
        }
      }
      if (series.size === 0) {
        console.log(`history skip ${slug}: no commits by ${AUTHOR}`);
        continue;
      }
      perRepo.set(slug, series);
      console.log(`history ${repo}: ${series.size} active weeks (${AUTHOR} only)`);
    } catch (err) {
      historyFailed++;
      console.error(`history skip ${slug}: ${err.message}`);
      await sleep(2500);
      continue;
    }
  }

  const allWeeks = [
    ...new Set([...perRepo.values()].flatMap((s) => [...s.keys()])),
  ].sort((a, b) => a - b);
  const last52 = allWeeks.slice(-52);

  const weeks = last52.map((week) => {
    const repos = {};
    let total = 0;
    for (const [slug, series] of perRepo) {
      const n = series.get(week) || 0;
      if (n > 0) {
        repos[slug] = n;
        total += n;
      }
    }
    return { week, total, repos };
  });

  mkdirSync('src/data', { recursive: true });
  writeFileSync(
    'src/data/commit-history.json',
    JSON.stringify({ generatedAt: new Date().toISOString(), weeks }, null, 2) +
      '\n'
  );
  console.log(
    `history done: ${perRepo.size} repos, ${weeks.length} weeks, ${historyFailed} failed`
  );
} catch (err) {
  console.error(`history phase failed (totals kept): ${err.message}`);
}
