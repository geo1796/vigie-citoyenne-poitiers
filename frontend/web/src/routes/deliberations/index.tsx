import { deliberationsQueries } from "@/features/deliberations/api";
import { DeliberationsPage } from "@/features/deliberations/components/DeliberationsPage";
import { listDeliberationsParamsSchema } from "@/features/deliberations/model";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/deliberations/")({
	validateSearch: listDeliberationsParamsSchema,
	loaderDeps: ({ search }) => ({ search }),
	loader: ({ context, deps }) =>
		context.queryClient.ensureInfiniteQueryData(
			deliberationsQueries.infiniteList(deps.search),
		),
	component: DeliberationsPage,
});
