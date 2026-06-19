import { createFileRoute } from "@tanstack/react-router";
import { deliberationsQueries } from "@/features/deliberations/api";
import { DeliberationDetailPage } from "@/features/deliberations/components/DeliberationDetailPage";

export const Route = createFileRoute("/deliberations/$deliberationId")({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData(
			deliberationsQueries.detail(params.deliberationId),
		),
	component: DeliberationDetailPage,
});
