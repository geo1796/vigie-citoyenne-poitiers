import { Route } from "@/routes/deliberations/$deliberationId";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { deliberationsQueries } from "../api";
import type { Deliberation, DeliberationDocument } from "../model";
import {
	collectiviteLabels,
	instanceLabels,
	isAdoptee,
	isUnanime,
} from "../model";

import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { useState } from "react";

function DocumentsSection({
	documents,
}: {
	documents: DeliberationDocument[];
}) {
	const [active, setActive] = useState<DeliberationDocument | null>(null);

	if (documents.length === 0) return null;

	return (
		<section className="mt-12 space-y-4">
			<h2 className="text-xs uppercase tracking-wider text-muted-foreground">
				Documents officiels
			</h2>

			<ul className="space-y-0.5">
				{documents.map((doc) => (
					<li key={doc.url}>
						<button
							type="button"
							onClick={() => setActive(doc)}
							className="group -mx-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
						>
							<FileText
								className="size-4 shrink-0 text-primary"
								aria-hidden="true"
							/>
							<span className="flex-1 text-sm text-foreground">
								{doc.label}
							</span>
							<span className="text-xs uppercase tracking-wider text-muted-foreground">
								PDF
							</span>
						</button>
					</li>
				))}
			</ul>

			<Dialog
				open={active !== null}
				onOpenChange={(open) => !open && setActive(null)}
			>
				<DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 p-0 sm:max-w-5xl">
					<div className="flex items-center justify-start gap-4 border-b border-border py-3 pl-4 pr-3">
						<DialogTitle className="truncate text-sm font-medium">
							{active?.label}
						</DialogTitle>
						<div className="flex shrink-0 items-center gap-1">
							<a
								href={active?.url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								Ouvrir dans un onglet
								<ArrowUpRight className="size-3.5" aria-hidden="true" />
							</a>
						</div>
					</div>
					{active && (
						<iframe
							src={active.url}
							title={active.label}
							className="min-h-0 flex-1 bg-muted"
						/>
					)}
				</DialogContent>
			</Dialog>
		</section>
	);
}

function formatLongDate(d: Date): string {
	return d.toLocaleDateString("fr-FR", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function VoteResultHeading({
	deliberation: d,
}: {
	deliberation: Deliberation;
}) {
	if (isUnanime(d)) {
		return (
			<div className="text-2xl font-semibold text-muted-foreground">
				Adoptée à l'unanimité
			</div>
		);
	}
	if (isAdoptee(d)) {
		return <div className="text-2xl font-semibold">Adoptée</div>;
	}
	return <div className="text-2xl font-semibold text-destructive">Rejetée</div>;
}

function VoteBarLarge({ deliberation: d }: { deliberation: Deliberation }) {
	const total = d.votePour + d.voteContre + d.voteAbstention;
	if (total === 0) {
		return null;
	}

	const pctPour = (d.votePour / total) * 100;
	const pctContre = (d.voteContre / total) * 100;
	const pctAbstention = (d.voteAbstention / total) * 100;

	return (
		<div className="space-y-2">
			<div
				className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
				role="img"
				aria-label={`Vote : ${d.votePour} pour, ${d.voteContre} contre, ${d.voteAbstention} abstentions`}
			>
				{pctPour > 0 && (
					<div className="h-full bg-chart-3" style={{ width: `${pctPour}%` }} />
				)}
				{pctContre > 0 && (
					<div
						className="h-full bg-chart-5"
						style={{ width: `${pctContre}%` }}
					/>
				)}
				{pctAbstention > 0 && (
					<div
						className="h-full bg-muted-foreground/40"
						style={{ width: `${pctAbstention}%` }}
					/>
				)}
			</div>

			<div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
				<div>
					<span
						className="mr-2 inline-block size-2 rounded-full bg-chart-3"
						aria-hidden="true"
					/>
					<span className="font-semibold">{d.votePour}</span>{" "}
					<span className="text-muted-foreground">
						pour ({Math.round(pctPour)}%)
					</span>
				</div>
				<div>
					<span
						className="mr-2 inline-block size-2 rounded-full bg-chart-5"
						aria-hidden="true"
					/>
					<span className="font-semibold">{d.voteContre}</span>{" "}
					<span className="text-muted-foreground">
						contre ({Math.round(pctContre)}%)
					</span>
				</div>
				<div>
					<span
						className="mr-2 inline-block size-2 rounded-full bg-muted-foreground/40"
						aria-hidden="true"
					/>
					<span className="font-semibold">{d.voteAbstention}</span>{" "}
					<span className="text-muted-foreground">
						abstention{d.voteAbstention > 1 ? "s" : ""} (
						{Math.round(pctAbstention)}%)
					</span>
				</div>
			</div>
		</div>
	);
}

export function DeliberationDetailPage() {
	const { deliberationId } = Route.useParams();
	const router = useRouter();
	const { data } = useSuspenseQuery(
		deliberationsQueries.detail(deliberationId),
	);

	// const tauxPresence =
	// 	d.voteEffectif > 0 ? Math.round((d.voteReel / d.voteEffectif) * 100) : null;

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
				Retour
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

			{/* Résultat + détails du vote */}
			<section className="mt-10 space-y-6">
				<h2 className="text-xs uppercase tracking-wider text-muted-foreground">
					Résultat du vote
				</h2>

				<VoteResultHeading deliberation={data.deliberation} />

				<VoteBarLarge deliberation={data.deliberation} />

				{/* Participation */}
				<div className="border-t border-border pt-4 text-sm text-muted-foreground">
					<span className="font-medium text-foreground">
						{data.deliberation.voteReel}
					</span>{" "}
					votants présents sur{" "}
					<span className="font-medium text-foreground">
						{data.deliberation.voteEffectif}
					</span>{" "}
					élus
					{/* {tauxPresence !== null && (
						<>
							{" · "}
							<span className="font-medium text-foreground">
								{tauxPresence.toFixed(2)}%
							</span>{" "}
							de présence
						</>
					)} */}
				</div>
			</section>

			{data.documents && <DocumentsSection documents={data.documents} />}

			{/* Métadonnées administratives */}
			<section className="mt-12 space-y-4">
				<h2 className="text-xs uppercase tracking-wider text-muted-foreground">
					Classification administrative
				</h2>

				<dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-[180px_1fr]">
					<dt className="text-muted-foreground">Matière</dt>
					<dd>
						<span className="font-mono text-muted-foreground">
							{data.deliberation.delibMatiereCode}
						</span>
						<span className="mx-2 text-muted-foreground">·</span>
						<span>{data.deliberation.delibMatiereNom}</span>
					</dd>

					{data.deliberation.delibId ? (
						<>
							<dt className="text-muted-foreground">Identifiant</dt>
							<dd className="font-mono text-xs text-muted-foreground">
								{data.deliberation.delibId}
							</dd>
						</>
					) : null}
				</dl>
			</section>
		</div>
	);
}
