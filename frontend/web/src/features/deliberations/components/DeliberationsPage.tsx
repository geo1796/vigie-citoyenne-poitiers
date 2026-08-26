import { useInfiniteQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Route } from '@/routes/deliberations/index';
import { Button } from '@/shadcn/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shadcn/components/ui/sheet';
import { deliberationsQueries } from '../api';
import { DeliberationCard } from './DeliberationCard';
import { DeliberationsFilter } from './DeliberationsFilter';

function getSessionKey(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

function formatSessionLabel(key: string): string {
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function DeliberationsPage() {
  const search = Route.useSearch();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError, error } =
    useInfiniteQuery(deliberationsQueries.infiniteList(search));

  const deliberations = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  // ⚠️ Remplace `delibDate` ci-dessous par le vrai nom du champ date dans ton modèle
  const sessions = useMemo(() => {
    type Item = (typeof deliberations)[number];
    const groups: Array<{ key: string; items: Item[] }> = [];
    let current: { key: string; items: Item[] } | null = null;

    for (const d of deliberations) {
      const key = getSessionKey(d.delibDate); // 👈 ICI le champ à confirmer
      if (!current || current.key !== key) {
        current = { key, items: [] };
        groups.push(current);
      }
      current.items.push(d);
    }
    return groups;
  }, [deliberations]);

  const totalLoaded = deliberations.length;

  // Compte des filtres actifs pour le badge sur le bouton mobile
  const activeFilterCount =
    (search.search ? 1 : 0) +
    (search.collectivites?.length ?? 0) +
    (search.instances?.length ?? 0) +
    (search.dateFrom ? 1 : 0) +
    (search.dateTo ? 1 : 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Délibérations</h1>
        <p className="mt-2 text-muted-foreground">
          Activité délibérative des conseils de Poitiers et de Grand Poitiers
        </p>
      </header>

      {/* Barre d'action mobile/tablette : compteur + bouton filtres */}
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <div className="text-sm">
          {isPending ? (
            <span className="text-muted-foreground">Chargement…</span>
          ) : (
            <>
              <span className="font-semibold">{totalLoaded}</span>{' '}
              <span className="text-muted-foreground">
                {totalLoaded > 1 ? 'chargées' : 'chargée'}
              </span>
            </>
          )}
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="size-4" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-sm bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            }
          />
          <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:w-96">
            <SheetHeader className="border-b border-border px-4 py-4">
              <SheetTitle className="text-left text-xs font-normal uppercase tracking-wider text-muted-foreground">
                Filtres
              </SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">
              <DeliberationsFilter params={search} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar desktop uniquement */}
        <aside className="hidden lg:sticky lg:top-20 lg:block lg:h-fit lg:self-start">
          <div className="space-y-1 border-b border-border pb-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Affichage</div>
            <div className="text-sm">
              {isPending ? (
                <span className="text-muted-foreground">Chargement…</span>
              ) : (
                <span>
                  <span className="font-semibold text-foreground">{totalLoaded}</span>{' '}
                  <span className="text-muted-foreground">
                    {totalLoaded > 1 ? 'délibérations chargées' : 'délibération chargée'}
                  </span>
                </span>
              )}
            </div>
          </div>

          <DeliberationsFilter params={search} />
        </aside>

        <div className="min-w-0">
          {isPending && <p className="text-muted-foreground">Chargement…</p>}

          {isError && <p className="text-destructive">Erreur : {error.message}</p>}

          {!isPending && !isError && deliberations.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-16 text-center">
              <p className="text-muted-foreground">
                Aucune délibération ne correspond à votre recherche.
              </p>
            </div>
          )}

          {sessions.length > 0 && (
            <div className="space-y-10">
              {sessions.map((session) => (
                <section key={session.key} aria-labelledby={`session-${session.key}`}>
                  <div className="sticky top-14 z-10 -mx-4 mb-4 bg-background/95 px-4 py-3 backdrop-blur-sm supports-backdrop-filter:bg-background/80 sm:-mx-6 sm:px-6">
                    <h2
                      id={`session-${session.key}`}
                      className="text-xs font-medium uppercase tracking-wider sm:text-sm"
                    >
                      <span className="text-foreground">{formatSessionLabel(session.key)}</span>
                      <span className="ml-2 text-muted-foreground">
                        · {session.items.length} délibération
                        {session.items.length > 1 ? 's' : ''}
                      </span>
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {session.items.map((d) => (
                      <DeliberationCard key={d.id} deliberation={d} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Chargement…' : 'Voir plus'}
              </Button>
            </div>
          )}

          {!hasNextPage && deliberations.length > 0 && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Toutes les délibérations ont été chargées.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
