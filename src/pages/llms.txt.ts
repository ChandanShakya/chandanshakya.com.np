import { getCollection } from 'astro:content';
import { SITE } from '../lib/constants';
import { formatDate, sortDesc } from '../lib/utils';

export async function GET() {
  const posts = sortDesc(await getCollection('blog'), (p) => p.data.date.valueOf());
  const projects = sortDesc(await getCollection('projects'), (p) => p.data.date.valueOf());

  const lines = [
    `# ${SITE.title} — Portfolio & Blog`,
    '',
    `> ${SITE.description}`,
    '',
    '## About',
    'Personal portfolio showcasing projects, blog posts, and technical writing. Built with Astro (static output), hand-written CSS with a brutalist text-first design. No Tailwind, no client JS framework.',
    '',
    '## Full content',
    `See /llms-full.txt for the complete text of all ${posts.length} posts and ${projects.length} projects in one fetch.`,
    '',
    '## Key Sections',
    ...[
      `- [Projects](${SITE.siteUrl}/projects) — ${projects.length} projects`,
      `- [Blog](${SITE.siteUrl}/blog) — ${posts.length} technical articles`,
      `- [Archive](${SITE.siteUrl}/archive) — Complete timeline of all content`,
    ],
    '',
    '## Latest Posts',
    ...posts
      .slice(0, 5)
      .map((p) => `- [${p.data.title}](${SITE.siteUrl}/blog/${p.id}/) (${formatDate(p.data.date)})`),
    '',
    '## Contact',
    '- GitHub: https://github.com/ChandanShakya',
    '- Twitter: https://twitter.com/ZXY_CC_3ag13',
    '- LinkedIn: https://linkedin.com/in/ChandanShakya',
    `- Email: Via contact form at ${SITE.siteUrl}/#contact`,
    '',
  ];

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
