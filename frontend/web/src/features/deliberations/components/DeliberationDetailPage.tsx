import { Route } from "@/routes/deliberations/$deliberationId";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { deliberationsQueries } from "../api";
import { collectiviteLabels, instanceLabels } from "../model";
import { DeliberationDetailBody } from "./DeliberationDetailBody";

function formatLongDate(d: Date): string {
	return d.toLocaleDateString("fr-FR", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function DeliberationDetailPage() {
	const { deliberationId } = Route.useParams();
	const router = useRouter();
	const { data } = useSuspenseQuery(
		deliberationsQueries.detail(deliberationId),
	);

	const handleBack = () => {
		// Si on a un historique de navigation, on revient en arrière (préserve les filtres).
		// Sinon (arrivée directe via URL partagée), on tombe sur la liste vierge.
		if (router.history.canGoBack()) {
			router.history.back();
		} else {
			router.navigate({
				to: "/deliberations",
				search: { limit: 25, offset: 0, sortAsc: false },
			});
		}
	};

	return (
		<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
			{/* Lien retour */}
			<button
				type="button"
				onClick={handleBack}
				className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Retour aux délibérations
			</button>

			{/* Eyebrow institutionnel */}
			<div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-wider text-muted-foreground">
				<span>{instanceLabels[data.deliberation.instance]}</span>
				<span aria-hidden="true" className="text-border">
					·
				</span>
				<span>{collectiviteLabels[data.deliberation.collectivite]}</span>
				<span aria-hidden="true" className="text-border">
					·
				</span>
				<time dateTime={data.deliberation.delibDate.toISOString()}>
					{formatLongDate(data.deliberation.delibDate)}
				</time>
			</div>

			{/* Titre */}
			<h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
				{data.deliberation.delibObjet}
			</h1>

			{/* Corps : résultat du vote, documents, classification */}
			<div className="mt-10">
				<DeliberationDetailBody
					deliberation={data.deliberation}
					documents={data.documents}
				/>
			</div>
		</div>
	);
}
