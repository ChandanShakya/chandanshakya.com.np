import { getCollection } from 'astro:content';
import { SITE } from '../lib/constants';
import { formatDate, sortDesc } from '../lib/utils';

export async function GET() {
  const posts = sortDesc(await getCollection('blog'), (p) => p.data.date.valueOf());
  const projects = sortDesc(await getCollection('projects'), (p) => p.data.date.valueOf());

  const out = [`# ${SITE.title} — Full Content Export`, ''];

  out.push('## Blog Posts', '');
  for (const p of posts) {
    out.push(`### ${p.data.title} (${formatDate(p.data.date)})`, '', p.body ?? '', '', '---', '');
  }

  out.push('## Projects', '');
  for (const p of projects) {
    out.push(
      `### ${p.data.title} (${p.data.category})`,
      '',
      p.data.description,
      `Link: ${p.data.link}`,
      '',
      p.body ?? '',
      '',
      '---',
      '',
    );
  }

  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
