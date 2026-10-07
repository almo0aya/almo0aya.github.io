import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(), description: z.string(), date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    corrections: z.array(z.object({ date: z.coerce.date(), note: z.string().min(1) })).default([]),
    tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
    draft: z.boolean().default(false),
  }).superRefine((post, ctx) => {
    if (post.updated && post.updated < post.date) ctx.addIssue({ code: 'custom', message: 'Updated date must not precede publication.' });
    for (const correction of post.corrections) {
      if (correction.date < post.date || !post.updated || correction.date > post.updated) ctx.addIssue({ code: 'custom', message: 'Corrections require an updated date covering every correction, after publication.' });
    }
  }),
});
export const collections = { blog };
