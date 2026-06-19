import { Link } from "@tanstack/react-router";
import type { Indicateur } from "../model";
import { indicateurKeyLabels } from "../model";

interface Props {
	indicateur: Indicateur;
}

export function IndicateurCard({ indicateur }: Props) {
	const label = indicateurKeyLabels[indicateur.key];
	const period = formatPeriod(
		indicateur.firstReference,
		indicateur.lastReference,
	);

	return (
		<Link
			to="/indicateurs/$indicateurKey"
			params={{ indicateurKey: indicateur.key }}
			className="group block rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/20 hover:bg-accent/40"
		>
			<div className="space-y-3">
				<div className="text-xs uppercase tracking-wider text-muted-foreground">
					Indicateur
				</div>

				<h2 className="text-lg font-semibold leading-tight text-foreground">
					{label}
				</h2>

				<dl className="space-y-1.5 text-sm">
					<div className="flex items-baseline justify-between gap-3">
						<dt className="text-muted-foreground">Période</dt>
						<dd className="font-medium tabular-nums text-foreground">
							{period}
						</dd>
					</div>
					<div className="flex items-baseline justify-between gap-3">
						<dt className="text-muted-foreground">Observations</dt>
						<dd className="font-medium tabular-nums text-foreground">
							{indicateur.observationsCount}
						</dd>
					</div>
				</dl>
			</div>
		</Link>
	);
}

function formatPeriod(first: string, last: string): string {
	if (first === last) return first;
	return `${first} – ${last}`;
}
