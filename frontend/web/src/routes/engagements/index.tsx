import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/engagements/")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
			<header className="mb-8">
				<div className="flex items-baseline gap-3">
					<h1 className="text-3xl font-semibold tracking-tight">Engagements</h1>
					<span className="text-xs uppercase tracking-wider text-muted-foreground">
						À venir
					</span>
				</div>
				<p className="mt-2 text-muted-foreground">
					Promesses publiques et plans pluriannuels, et leur trajectoire
					d'exécution
				</p>
			</header>
		</div>
	);
}
