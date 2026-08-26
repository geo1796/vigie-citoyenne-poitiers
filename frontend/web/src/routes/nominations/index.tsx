import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/nominations/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Nominations</h1>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">À venir</span>
        </div>
        <p className="mt-2 text-muted-foreground">
          Cartographie des désignations dans les satellites de la collectivité
        </p>
      </header>
    </div>
  );
}
