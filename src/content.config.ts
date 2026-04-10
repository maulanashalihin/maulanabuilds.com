import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

const proposals = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/proposals" }),
	schema: z.object({
		title: z.string(),
		client: z.string(),
		author: z.string(),
		role: z.string(),
		contact: z.string(),
		date: z.string(),
		status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
		links: z.object({
			github: z.string().url(),
			portfolio: z.string().url(),
		}).optional(),
		tags: z.array(z.string()).optional(),
	}),
});

export const collections = { proposals };
