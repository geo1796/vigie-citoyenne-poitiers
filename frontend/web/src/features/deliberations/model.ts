import { z } from 'zod';

export const collectiviteSchema = z.enum(['poitiers', 'grand_poitiers']);
export type Collectivite = z.infer<typeof collectiviteSchema>;
export const collectiviteLabels: Record<Collectivite, string> = {
  poitiers: 'Poitiers',
  grand_poitiers: 'Grand Poitiers',
};

export const instanceSchema = z.enum([
  'conseil_municipal',
  'conseil_communautaire',
  'bureau_communautaire',
]);
export type Instance = z.infer<typeof instanceSchema>;
export const instanceLabels: Record<Instance, string> = {
  conseil_municipal: 'Conseil municipal',
  conseil_communautaire: 'Conseil communautaire',
  bureau_communautaire: 'Bureau communautaire',
};

export const deliberationSchema = z.object({
  id: z.uuid(),
  delibId: z.string(),

  collectivite: collectiviteSchema,
  instance: instanceSchema,

  collNom: z.string(),
  collSiret: z.string(),

  delibDate: z.coerce.date(), // accepte string ISO, renvoie Date
  delibObjet: z.string(),
  delibMatiereCode: z.string(),
  delibMatiereNom: z.string(),

  prefId: z.string().nullish(),
  prefDate: z.coerce.date().nullish(),

  voteEffectif: z.number().int(),
  voteReel: z.number().int(),
  votePour: z.number().int(),
  voteContre: z.number().int(),
  voteAbstention: z.number().int(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Deliberation = z.infer<typeof deliberationSchema>;

export const deliberationDocumentSchema = z.object({
  url: z.string(),
  label: z.string(),
});

export type DeliberationDocument = z.infer<typeof deliberationDocumentSchema>;

export function isAdoptee(d: Deliberation): boolean {
  return d.votePour > d.voteContre;
}

export function isUnanime(d: Deliberation): boolean {
  return d.voteContre === 0 && d.voteAbstention === 0 && d.votePour > 0;
}

export function tauxParticipation(d: Deliberation): number {
  if (d.voteEffectif === 0) return 0;
  return d.voteReel / d.voteEffectif;
}

export const listDeliberationsParamsSchema = z.object({
  search: z.string().optional(),
  collectivites: z.array(collectiviteSchema).optional(),
  instances: z.array(instanceSchema).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(100).default(25),
  offset: z.number().int().min(0).default(0),
  sortAsc: z.boolean().default(false),
});

export type ListDeliberationsParams = z.infer<typeof listDeliberationsParamsSchema>;

export const listDeliberationsResultSchema = z.object({
  items: z.array(deliberationSchema),
  hasMore: z.boolean(),
  nextOffset: z.number().int(),
});

export type ListDeliberationsResult = z.infer<typeof listDeliberationsResultSchema>;

export const findDeliberationResultSchema = z.object({
  deliberation: deliberationSchema,
  documents: z.array(deliberationDocumentSchema).optional(),
});

export type FindDeliberationResult = z.infer<typeof findDeliberationResultSchema>;
