import { z } from "zod";

export const ligneBudgetCategorieSchema = z.enum(["depenses", "recettes"]);
export type LigneBudgetCategorie = z.infer<typeof ligneBudgetCategorieSchema>;

export const ligneBudgetSectionSchema = z.enum([
	"fonctionnement",
	"investissement",
]);
export type LigneBudgetSection = z.infer<typeof ligneBudgetSectionSchema>;

export const ligneBudgetSchema = z.object({
	// Identité comptable (nature)
	operation: z.string(),
	chapitre: z.string(),
	libelleChapitre: z.string(),
	// Identité fonctionnelle (politique publique)
	codeFonctionnel: z.string(),
	libelleFonction: z.string(),
	// Axes existants
	categorie: ligneBudgetCategorieSchema,
	section: ligneBudgetSectionSchema,
	libelleBudget: z.string(),
	// Montants
	totalBP: z.number(),
	realise: z.number().nullable(),
});
export type LigneBudget = z.infer<typeof ligneBudgetSchema>;

export const budgetObservationDataSchema = z.object({
	lignes: z.array(ligneBudgetSchema),
});
export type BudgetObservationData = z.infer<typeof budgetObservationDataSchema>;

// ---------------------------------------------------------------------------
// Base budget réalisé / voté
// ---------------------------------------------------------------------------
export const budgetBaseSchema = z.enum(["realise", "vote"]);
export type BudgetBase = "vote" | "realise";

export const budgetBaseLabels: Record<BudgetBase, string> = {
	realise: "Réalisé",
	vote: "Voté",
};

// ---------------------------------------------------------------------------
// Axes de ventilation
// ---------------------------------------------------------------------------

export const ventilationAxeSchema = z.enum(["budget", "chapitre", "fonction"]);
export type VentilationAxe = "fonction" | "chapitre" | "budget";

export const ventilationAxeLabels: Record<VentilationAxe, string> = {
	fonction: "Par politique publique",
	chapitre: "Par nature",
	budget: "Par budget",
};

export interface VentilationPart {
	libelle: string;
	montant: number;
}

// Constantes pour le segment « non ventilé ». La clé est interne (jamais affichée),
// le libellé est ce que voit l'utilisateur. Une clé technique évite les collisions
// avec une vraie clé qui aurait par accident la même valeur.
const NON_VENTILE_KEY = "__non_ventile__";
const NON_VENTILE_LIBELLE = "Non ventilé";

// Retourne la clé de regroupement pour un axe donné, ou null si la ligne n'a
// pas l'information nécessaire pour être ventilée sur cet axe (champs vides
// dans la source open data).
function getGroupingKey(
	l: LigneBudget,
	axe: VentilationAxe,
): { key: string; libelle: string } | null {
	switch (axe) {
		case "fonction":
			if (!l.codeFonctionnel || !l.libelleFonction) return null;
			return { key: l.codeFonctionnel, libelle: l.libelleFonction };
		case "chapitre":
			if (!l.chapitre || !l.libelleChapitre) return null;
			return { key: l.chapitre, libelle: l.libelleChapitre };
		case "budget":
			if (!l.libelleBudget) return null;
			return { key: l.libelleBudget, libelle: l.libelleBudget };
	}
}

export function ventilationParPoste(
	lignes: LigneBudget[],
	categorie: LigneBudgetCategorie,
	axe: VentilationAxe,
	options: { maxParts?: number; useBP?: boolean } = {},
): VentilationPart[] {
	const { maxParts = 7, useBP = false } = options;
	const groupes = new Map<string, { libelle: string; montant: number }>();

	for (const l of lignes) {
		if (l.categorie !== categorie) continue;

		const montant = useBP ? l.totalBP : l.realise;
		if (montant === null || montant === 0) continue;

		const grouping = getGroupingKey(l, axe);
		const key = grouping?.key ?? NON_VENTILE_KEY;
		const libelle = grouping?.libelle ?? NON_VENTILE_LIBELLE;
		const current = groupes.get(key);
		if (current) {
			current.montant += montant;
		} else {
			groupes.set(key, { libelle, montant });
		}
	}

	const nonVentile = groupes.get(NON_VENTILE_KEY);
	groupes.delete(NON_VENTILE_KEY);

	const sorted = [...groupes.values()].sort((a, b) => b.montant - a.montant);

	let result: VentilationPart[];
	if (sorted.length <= maxParts) {
		result = sorted;
	} else {
		const tete = sorted.slice(0, maxParts);
		const reste = sorted.slice(maxParts);
		const autresMontant = reste.reduce((acc, p) => acc + p.montant, 0);
		result = [...tete, { libelle: "Autres", montant: autresMontant }];
	}

	if (nonVentile) {
		result.push({
			libelle: NON_VENTILE_LIBELLE,
			montant: nonVentile.montant,
		});
	}

	return result;
}

export interface EcartPoste {
	libelle: string;
	bp: number;
	realise: number;
}

export function ventilationEcartParPoste(
	lignes: LigneBudget[],
	categorie: LigneBudgetCategorie,
	axe: VentilationAxe,
): EcartPoste[] {
	const groupes = new Map<
		string,
		{ libelle: string; bp: number; realise: number }
	>();

	for (const l of lignes) {
		if (l.categorie !== categorie) continue;
		const grouping = getGroupingKey(l, axe);
		const key = grouping?.key ?? NON_VENTILE_KEY;
		const libelle = grouping?.libelle ?? NON_VENTILE_LIBELLE;
		const current = groupes.get(key);
		if (current) {
			current.bp += l.totalBP;
			current.realise += l.realise ?? 0;
		} else {
			groupes.set(key, {
				libelle,
				bp: l.totalBP,
				realise: l.realise ?? 0,
			});
		}
	}

	// Même logique que ventilationParPoste : on isole « Non ventilé »,
	// on trie le reste par BP décroissant, on remet « Non ventilé » à la fin.
	const nonVentile = groupes.get(NON_VENTILE_KEY);
	groupes.delete(NON_VENTILE_KEY);

	const result: EcartPoste[] = [...groupes.values()].sort(
		(a, b) => b.bp - a.bp,
	);

	if (nonVentile) {
		result.push(nonVentile);
	}

	return result;
}
