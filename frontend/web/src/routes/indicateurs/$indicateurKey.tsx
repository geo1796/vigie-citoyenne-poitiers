import { createFileRoute } from "@tanstack/react-router";
import { indicateursQueries } from "@/features/indicateurs/api";
import { IndicateurDetailPage } from "@/features/indicateurs/components/IndicateurDetailPage";
import { indicateurKeySchema } from "@/features/indicateurs/model";
import z from "zod";
import { budgetBaseSchema, ventilationAxeSchema } from "@/features/indicateurs/components/budgets/model";

const searchSchema = z.object({
	exercice: z.string().optional(),
	axe: ventilationAxeSchema.optional(),
	base: budgetBaseSchema.optional(),
});

export const Route = createFileRoute("/indicateurs/$indicateurKey")({
	validateSearch: searchSchema,
	loader: ({ context: { queryClient }, params }) => {
		const key = indicateurKeySchema.parse(params.indicateurKey);
		return queryClient.ensureQueryData(indicateursQueries.observations(key));
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { indicateurKey } = Route.useParams();
	// `key` est déjà validé par le loader, mais on re-parse pour le typage strict.
	return (
		<IndicateurDetailPage
			indicateurKey={indicateurKeySchema.parse(indicateurKey)}
		/>
	);
}
