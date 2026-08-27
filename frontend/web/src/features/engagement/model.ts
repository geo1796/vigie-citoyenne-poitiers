import { z } from 'zod';
import { deliberationSchema } from '@/features/deliberations/model';

export const engagementStatusSchema = z.enum([
  'en_attente',
  'en_cours',
  'en_tension',
  'tenu',
  'rompu',
]);

export type EngagementStatus = z.infer<typeof engagementStatusSchema>;

export const engagementStatusLabels: Record<EngagementStatus, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  en_tension: 'En tension',
  tenu: 'Tenu',
  rompu: 'Rompu',
};

export const engagementSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  status: engagementStatusSchema,
  // Provenance de l'engagement en texte libre.
  reference: z.string(),
  authorEmail: z.string(),
  // Date la plus récente parmi les mises à jour (null tant qu'il n'y en a aucune).
  eventDate: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Engagement = z.infer<typeof engagementSchema>;

export const engagementUpdateSchema = z.object({
  id: z.uuid(),
  status: engagementStatusSchema,
  content: z.string(),
  eventDate: z.coerce.date(),
  externalSource: z.string().nullable(),
  deliberation: deliberationSchema.nullable(),
  authorEmail: z.string(),
  createdAt: z.coerce.date(),
});

export type EngagementUpdate = z.infer<typeof engagementUpdateSchema>;

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
  updates: z.array(engagementUpdateSchema),
});

export type FindEngagementResult = z.infer<typeof findEngagementResultSchema>;

export const createEngagementInputSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis.'),
  reference: z.string().trim().min(1, 'La référence est requise.'),
});

export type CreateEngagementInput = z.infer<typeof createEngagementInputSchema>;

export const createEngagementUpdateInputSchema = z.object({
  status: engagementStatusSchema,
  // Format ISO « YYYY-MM-DD » attendu par le backend.
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date requise.'),
  content: z.string().trim().min(1, 'La note est requise.'),
  deliberationId: z.uuid().nullish(),
  externalSource: z.string().trim().url('Lien invalide.').nullish(),
});

export type CreateEngagementUpdateInput = z.infer<typeof createEngagementUpdateInputSchema>;
