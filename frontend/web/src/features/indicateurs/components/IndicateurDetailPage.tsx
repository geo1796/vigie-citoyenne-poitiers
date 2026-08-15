import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { indicateursQueries } from "../api";
import { type IndicateurKey, indicateurKeyLabels } from "../model";
import { IndicateurDetail } from "./IndicateurDetail";

interface Props {
	indicateurKey: IndicateurKey;
}

export function IndicateurDetailPage({ indicateurKey }: Props) {
	const { data: observations } = useSuspenseQuery(
		indicateursQueries.observations(indicateurKey),
	);

	const router = useRouter();

	const handleBack = () => {
		router.navigate({ to: "/indicateurs" });
	};

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
			<button
				type="button"
				onClick={handleBack}
				className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Retour
			</button>

			<header className="mb-8">
				<div className="text-xs uppercase tracking-wider text-muted-foreground">
					Indicateur
				</div>
				<h1 className="mt-1 text-3xl font-semibold tracking-tight">
					{indicateurKeyLabels[indicateurKey]}
				</h1>
			</header>

			<IndicateurDetail
				indicateurKey={indicateurKey}
				observations={observations}
			/>
		</div>
	);
}
