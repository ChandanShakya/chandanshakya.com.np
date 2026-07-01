import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    math: z.boolean().default(false),
    comments: z.boolean().default(true),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    img: z.string(),
    alt: z.string(),
    category: z.string(),
    link: z.string().url(),
    client: z.string().default('Public'),
    projectDate: z.string(),
  }),
});

export const collections = { blog, projects };
