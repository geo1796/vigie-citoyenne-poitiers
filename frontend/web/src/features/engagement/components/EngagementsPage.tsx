import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useSession } from '@/features/auth/api';
import { Route } from '@/routes/engagements/index';
import { Button } from '@/shadcn/components/ui/button';
import { engagementsQueries } from '../api';
import { EngagementCard } from './EngagementCard';

export function EngagementsPage() {
  const search = Route.useSearch();
  const { data: session } = useSession();
  const isContributeur = session?.roles.includes('contributeur') ?? false;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError, error } =
    useInfiniteQuery(engagementsQueries.infiniteList(search));

  const engagements = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Engagements</h1>
          <p className="mt-2 text-muted-foreground">
            Promesses publiques et plans pluriannuels, et leur trajectoire d'exécution
          </p>
        </div>

        {isContributeur && (
          <Button
            render={
              <Link to="/espace-contributeur/engagements/nouveau">
                <Plus className="size-4" />
                Nouvel engagement
              </Link>
            }
          />
        )}
      </header>

      {isPending && <p className="text-muted-foreground">Chargement…</p>}

      {isError && <p className="text-destructive">Erreur : {error.message}</p>}

      {!isPending && !isError && engagements.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">Aucun engagement n'a encore été enregistré.</p>
        </div>
      )}

      {engagements.length > 0 && (
        <div className="space-y-3">
          {engagements.map((e) => (
            <EngagementCard key={e.id} engagement={e} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Chargement…' : 'Voir plus'}
          </Button>
        </div>
      )}
    </div>
  );
}
