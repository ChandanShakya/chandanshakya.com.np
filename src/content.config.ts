import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    category: z.string(),
    link: z.string(),
    live: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
    client: z.string(),
    commits: z.number(),
  }),
});

const devices = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/devices' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    image: image().optional(),
    description: z.string(),
  }),
});

const photos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/photos' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    image: image(),
    device: z.string(),
    kind: z.enum(['photo', 'digital-art']),
    // Sveltia writes `order: null` when the field is left blank.
    order: z.number().nullish(),
    date: z.coerce.date(),
    location: z.string().optional(),
    caption: z.string().optional(),
  }),
});

const finds = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/finds' }),
  schema: z.object({
    title: z.string(),
    url: z.string().url().refine((u) => /^https?:\/\//i.test(u), 'url must be http(s)'),
    kind: z.enum(['video', 'article', 'link']).default('article'),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    note: z.string().optional(),
  }),
});

export const collections = { blog, projects, devices, photos, finds };
