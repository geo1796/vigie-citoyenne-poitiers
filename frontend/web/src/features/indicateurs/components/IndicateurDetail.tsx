import type { IndicateurKey, Observation } from "../model";
import { BudgetIndicateur } from "./budgets/BudgetIndicateur";

interface Props {
	indicateurKey: IndicateurKey;
	observations: Observation[];
}

// Dispatcher : route vers le composant de viz selon la nature de l'indicateur.
// Les 3 budgets partagent la même structure de données → même composant.
export function IndicateurDetail({ indicateurKey, observations }: Props) {
	switch (indicateurKey) {
		case "budget_ccas":
		case "budget_communaute_urbaine":
		case "budget_ville_poitiers":
			return <BudgetIndicateur observations={observations} />;
		default:
			return assertNever(indicateurKey);
	}
}

function assertNever(key: never): never {
	throw new Error(`Indicateur non géré : ${key as string}`);
}