import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
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

	return (
		<div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
			<Link
				to="/indicateurs"
				className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ChevronLeft className="size-4" />
				Indicateurs
			</Link>

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
