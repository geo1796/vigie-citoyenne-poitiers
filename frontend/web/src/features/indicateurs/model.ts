import { z } from 'zod';

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------
// Miroir des constantes Go de `internal/domain/indicateur`. À tenir
// synchronisé manuellement — la liste est courte et change rarement.

export const indicateurKeySchema = z.enum([
  'budget_ccas',
  'budget_communaute_urbaine',
  'budget_ville_poitiers',
]);
export type IndicateurKey = z.infer<typeof indicateurKeySchema>;

export const indicateurKeyLabels: Record<IndicateurKey, string> = {
  budget_ccas: 'Budget CCAS',
  budget_communaute_urbaine: 'Budget Communauté urbaine',
  budget_ville_poitiers: 'Budget Ville de Poitiers',
};

// ---------------------------------------------------------------------------
// Indicateur (vue agrégée pour la liste)
// ---------------------------------------------------------------------------

export const indicateurSchema = z.object({
  key: indicateurKeySchema,
  firstReference: z.string(),
  lastReference: z.string(),
  lastUpdate: z.coerce.date(),
  observationsCount: z.number().int().nonnegative(),
});

export type Indicateur = z.infer<typeof indicateurSchema>;

export const listIndicateursResultSchema = z.array(indicateurSchema);
export type ListIndicateursResult = z.infer<typeof listIndicateursResultSchema>;

// ---------------------------------------------------------------------------
// Observation
// ---------------------------------------------------------------------------
// `data` est laissée en `unknown` à la frontière API : chaque widget de
// présentation (un par `key`) parse `data` avec son propre schéma quand
// il sait quoi en faire. La feature core reste agnostique du métier.

export const observationSchema = z.object({
  id: z.uuid(),
  key: indicateurKeySchema,
  reference: z.string(),
  data: z.unknown(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Observation = z.infer<typeof observationSchema>;

export const listObservationsResultSchema = z.array(observationSchema);
export type ListObservationsResult = z.infer<typeof listObservationsResultSchema>;
