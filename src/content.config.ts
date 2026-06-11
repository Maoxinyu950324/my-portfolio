import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/projects" }),
  schema: z.object({
    title: z.string(),
    cover: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    gallery: z.array(z.object({
      image: z.string(),
      caption: z.string().optional(),
    })).optional(),
    date: z.coerce.date(),
    published: z.boolean().default(true),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/pages" }),
  schema: z.object({
    title: z.string().optional(),
    hero_title: z.string().optional(),
    hero_subtitle: z.string().optional(),
    hero_image: z.string().optional(),
    avatar: z.string().optional(),
    bio: z.string().optional(),
    email: z.string().optional(),
    social: z.array(z.object({
      platform: z.string(),
      url: z.string(),
    })).optional(),
  }),
});

export const collections = { projects, pages };
