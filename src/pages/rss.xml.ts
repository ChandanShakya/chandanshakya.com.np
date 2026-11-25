import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/constants';
import { sortDesc } from '../lib/utils';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const [posts, projects, photos, finds] = await Promise.all([
    getCollection('blog'),
    getCollection('projects'),
    getCollection('photos'),
    getCollection('finds'),
  ]);

  const items = [
    ...posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
    })),
    ...projects.map((project) => ({
      title: project.data.title,
      description: project.data.description,
      pubDate: project.data.date,
      link: `/projects/${project.id}/`,
    })),
    ...photos.map((photo) => ({
      title: photo.data.title,
      description: photo.data.caption ?? `Photo by ${SITE.author}: ${photo.data.title}`,
      pubDate: photo.data.date,
      link: `/photography/${photo.id}/`,
    })),
    ...finds.map((find) => ({
      title: find.data.title,
      description: find.data.note ?? `Find by ${SITE.author}: ${find.data.title}`,
      pubDate: find.data.date,
      link: `/finds/${find.id}/`,
    })),
  ];

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    items: sortDesc(items, (item) => item.pubDate.valueOf()),
  });
}
