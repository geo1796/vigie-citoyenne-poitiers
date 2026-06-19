import { indicateursQueries } from "@/features/indicateurs/api";
import { IndicateursPage } from "@/features/indicateurs/components/IndicateurPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/indicateurs/")({
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(indicateursQueries.list()),
	component: IndicateursPage,
});
