import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/constants';
import { sortDesc } from '../lib/utils';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = sortDesc(await getCollection('blog'), (post) => post.data.date.valueOf());

  return rss({
    title: `${SITE.title} Blog`,
    description: SITE.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
    })),
  });
}
