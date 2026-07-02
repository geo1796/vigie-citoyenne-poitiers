import type { IndicateurKey, Observation } from "../model";
import { BudgetIndicateur } from "./budgets/BudgetIndicateur";
import type { BudgetView } from "./budgets/model";

interface Props {
	indicateurKey: IndicateurKey;
	observations: Observation[];
	view: BudgetView;
	onViewChange: (patch: Partial<BudgetView>) => void;
}

// Dispatcher : route vers le composant de viz selon la nature de l'indicateur.
// Les 3 budgets partagent la même structure de données → même composant.
export function IndicateurDetail({
	indicateurKey,
	observations,
	view,
	onViewChange,
}: Props) {
	switch (indicateurKey) {
		case "budget_ccas":
		case "budget_communaute_urbaine":
		case "budget_ville_poitiers":
			return (
				<BudgetIndicateur
					observations={observations}
					view={view}
					onViewChange={onViewChange}
				/>
			);
		default:
			return assertNever(indicateurKey);
	}
}

function assertNever(key: never): never {
	throw new Error(`Indicateur non géré : ${key as string}`);
}
