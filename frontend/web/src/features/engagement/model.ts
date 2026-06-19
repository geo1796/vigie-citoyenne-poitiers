import { z } from 'zod';
import { deliberationSchema } from '@/features/deliberations/model';
import { observationSchema } from '@/features/indicateurs/model';

export const engagementSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  content: z.string(),
  authorEmail: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Engagement = z.infer<typeof engagementSchema>;

export const listEngagementsParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
});

export type ListEngagementsParams = z.infer<typeof listEngagementsParamsSchema>;

export const listEngagementsResultSchema = z.object({
  items: z.array(engagementSchema),
  hasMore: z.boolean(),
  nextOffset: z.number().int(),
});

export type ListEngagementsResult = z.infer<typeof listEngagementsResultSchema>;

export const findEngagementResultSchema = z.object({
  engagement: engagementSchema,
  deliberations: z.array(deliberationSchema),
  observations: z.array(observationSchema),
});

export type FindEngagementResult = z.infer<typeof findEngagementResultSchema>;

export const createEngagementInputSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis.'),
  content: z.string().trim().min(1, 'Le contenu est requis.'),
  deliberationIds: z.array(z.uuid()).default([]),
  observationIds: z.array(z.uuid()).default([]),
});

export type CreateEngagementInput = z.infer<typeof createEngagementInputSchema>;
