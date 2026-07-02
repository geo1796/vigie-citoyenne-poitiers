import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, ArrowUpRight, ChevronDown } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { DeliberationDetailBody } from '@/features/deliberations/components/DeliberationDetailBody';
import { instanceLabels } from '@/features/deliberations/model';
import type { BudgetView } from '@/features/indicateurs/components/budgets/model';
import { IndicateurDetail } from '@/features/indicateurs/components/IndicateurDetail';
import {
  type IndicateurKey,
  indicateurKeyLabels,
  type Observation,
} from '@/features/indicateurs/model';
import { Route } from '@/routes/engagements/$engagementId';
import { cn } from '@/shadcn/lib/utils';
import { engagementsQueries } from '../api';

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Période couverte par un groupe d'observations (ex. « 2021–2023 » ou « 2023 »).
function periodeLabel(observations: Observation[]): string {
  const refs = observations.map((o) => o.reference).sort();
  const min = refs[0];
  const max = refs[refs.length - 1];
  return min === max ? min : `${min}–${max}`;
}

// Item d'accordion piloté par le parent (single-open via useState) : pas d'état
// propre, on lui passe `open` et `onToggle`. Le panneau (et donc le lien vers la
// page complète) n'est rendu que lorsqu'il est déplié.
function AccordionItem({
  open,
  onToggle,
  header,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="min-w-0 flex-1">{header}</div>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>
      {open && <div className="border-t border-border px-4 py-6 sm:px-6">{children}</div>}
    </div>
  );
}

// Enveloppe l'indicateur avec son propre état de vue local (exercice/axe/base),
// isolé de l'URL — à la différence de la page /indicateurs qui le persiste.
function IndicateurPanel({
  indicateurKey,
  observations,
}: {
  indicateurKey: IndicateurKey;
  observations: Observation[];
}) {
  const [view, setView] = useState<BudgetView>({});
  return (
    <IndicateurDetail
      indicateurKey={indicateurKey}
      observations={observations}
      view={view}
      onViewChange={(patch) => setView((v) => ({ ...v, ...patch }))}
    />
  );
}

export function EngagementPage() {
  const { engagementId } = Route.useParams();
  const router = useRouter();
  const { data } = useSuspenseQuery(engagementsQueries.detail(engagementId));

  const { engagement, deliberations, observations } = data;

  // Single-open global : une seule clé ouverte à la fois, délibérations et
  // indicateurs confondus. Clés préfixées pour garantir l'unicité entre sections.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const toggle = (key: string) => setOpenKey((cur) => (cur === key ? null : key));

  // Les observations arrivent à plat (plusieurs clés / exercices possibles) ;
  // on regroupe par clé d'indicateur, ce qu'attend IndicateurDetail.
  const indicateurGroups = useMemo(() => {
    const map = new Map<IndicateurKey, Observation[]>();
    for (const o of observations) {
      const arr = map.get(o.key);
      if (arr) {
        arr.push(o);
      } else {
        map.set(o.key, [o]);
      }
    }
    return [...map.entries()].map(([key, obs]) => ({ key, observations: obs }));
  }, [observations]);

  const handleBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      router.navigate({ to: '/engagements', search: { limit: 25, offset: 0 } });
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <button
        type="button"
        onClick={handleBack}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Retour aux engagements
      </button>

      <div className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
        Engagement · ajouté le {formatLongDate(engagement.createdAt)}
      </div>

      <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
        {engagement.title}
      </h1>

      <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-foreground">
        {engagement.content}
      </div>

      {deliberations.length > 0 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Délibérations liées
          </h2>
          <div className="space-y-3">
            {deliberations.map((d) => {
              const key = `delib:${d.id}`;
              const open = openKey === key;
              return (
                <AccordionItem
                  key={key}
                  open={open}
                  onToggle={() => toggle(key)}
                  header={
                    <>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        {instanceLabels[d.instance]}
                      </div>
                      <div className="mt-1 font-medium leading-snug">{d.delibObjet}</div>
                    </>
                  }
                >
                  <DeliberationDetailBody deliberation={d} />
                  <div className="mt-10">
                    <Link
                      to="/deliberations/$deliberationId"
                      params={{ deliberationId: d.id }}
                      className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:underline"
                    >
                      Voir la délibération
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </AccordionItem>
              );
            })}
          </div>
        </section>
      )}

      {indicateurGroups.length > 0 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Indicateurs liés
          </h2>
          <div className="space-y-3">
            {indicateurGroups.map(({ key: indicateurKey, observations: obs }) => {
              const key = `indic:${indicateurKey}`;
              const open = openKey === key;
              return (
                <AccordionItem
                  key={key}
                  open={open}
                  onToggle={() => toggle(key)}
                  header={
                    <>
                      <div className="font-medium leading-snug">
                        {indicateurKeyLabels[indicateurKey]}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {periodeLabel(obs)}
                      </div>
                    </>
                  }
                >
                  <IndicateurPanel indicateurKey={indicateurKey} observations={obs} />
                  <div className="mt-10">
                    <Link
                      to="/indicateurs/$indicateurKey"
                      params={{ indicateurKey }}
                      className="inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:underline"
                    >
                      Voir l'indicateur
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </AccordionItem>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
