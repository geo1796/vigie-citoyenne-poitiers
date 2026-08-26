import { useSuspenseQuery } from '@tanstack/react-query';
import { indicateursQueries } from '../api';
import { IndicateurCard } from './IndicateurCard';

export function IndicateursPage() {
  const { data: indicateurs } = useSuspenseQuery(indicateursQueries.list());

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Indicateurs</h1>
        <p className="mt-2 text-muted-foreground">
          Grandeurs chiffrées suivies sur la durée du mandat à Poitiers et à Grand Poitiers
        </p>
      </header>

      {indicateurs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">Aucun indicateur disponible pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {indicateurs.map((i) => (
            <IndicateurCard key={i.key} indicateur={i} />
          ))}
        </div>
      )}
    </div>
  );
}
