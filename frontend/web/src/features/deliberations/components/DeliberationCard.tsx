import { Card, CardContent, CardHeader } from "@/shadcn/components/ui/card";
import { Link } from "@tanstack/react-router";
import type { Deliberation } from "../model";
import { instanceLabels, isAdoptee, isUnanime } from "../model";

type Props = {
	deliberation: Deliberation;
};

function VoteResult({ deliberation: d }: Props) {
	if (isUnanime(d)) {
		return (
			<span className="text-sm text-muted-foreground">
				Adoptée à l'unanimité
			</span>
		);
	}
	if (isAdoptee(d)) {
		return <span className="text-sm font-medium text-foreground">Adoptée</span>;
	}
	return <span className="text-sm font-medium text-destructive">Rejetée</span>;
}

function VoteBar({ deliberation: d }: Props) {
	// Unanimité : barre pleine d'une seule teinte, plus discrète
	if (isUnanime(d)) {
		return (
			<div
				className="h-1 w-full rounded-full bg-chart-3 opacity-40"
				aria-hidden="true"
			/>
		);
	}

	const total = d.votePour + d.voteContre + d.voteAbstention;
	if (total === 0) {
		return null;
	}

	const pctPour = (d.votePour / total) * 100;
	const pctContre = (d.voteContre / total) * 100;
	const pctAbstention = (d.voteAbstention / total) * 100;

	return (
		<div
			className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted"
			role="img"
			aria-label={`Vote : ${d.votePour} pour, ${d.voteContre} contre, ${d.voteAbstention} abstentions`}
		>
			{pctPour > 0 && (
				<div className="h-full bg-chart-3" style={{ width: `${pctPour}%` }} />
			)}
			{pctContre > 0 && (
				<div className="h-full bg-chart-5" style={{ width: `${pctContre}%` }} />
			)}
			{pctAbstention > 0 && (
				<div
					className="h-full bg-muted-foreground/40"
					style={{ width: `${pctAbstention}%` }}
				/>
			)}
		</div>
	);
}

export function DeliberationCard({ deliberation: d }: Props) {
	return (
		<Link
			to="/deliberations/$deliberationId"
			params={{ deliberationId: d.id }}
			className="block rounded-lg transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
		>
			<Card>
				<CardHeader className="space-y-3">
					<div className="text-xs uppercase tracking-wider text-muted-foreground">
						{instanceLabels[d.instance]}
					</div>

					<h3 className="text-lg font-semibold leading-snug tracking-tight">
						{d.delibObjet}
					</h3>
				</CardHeader>

				<CardContent className="space-y-3">
					{/* Bloc résultat + visualisation */}
					<div className="space-y-2">
						<div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
							<VoteResult deliberation={d} />
							{!isUnanime(d) && (
								<div className="text-xs text-muted-foreground">
									<span className="font-medium text-foreground">
										{d.votePour}
									</span>{" "}
									pour
									{" · "}
									<span className="font-medium text-foreground">
										{d.voteContre}
									</span>{" "}
									contre
									{" · "}
									<span className="font-medium text-foreground">
										{d.voteAbstention}
									</span>{" "}
									abstention{d.voteAbstention > 1 ? "s" : ""}
									{" · "}
									<span>sur {d.voteReel} votants</span>
								</div>
							)}
						</div>

						<VoteBar deliberation={d} />
					</div>

					{/* Matière en bas, discrète */}
					<div className="text-xs text-muted-foreground">
						{d.delibMatiereCode} · {d.delibMatiereNom}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
