import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { DeliberationCard } from '@/features/deliberations/components/DeliberationCard';
import { indicateurKeyLabels } from '@/features/indicateurs/model';
import { Route } from '@/routes/engagements/$engagementId';
import { engagementsQueries } from '../api';

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function EngagementPage() {
  const { engagementId } = Route.useParams();
  const router = useRouter();
  const { data } = useSuspenseQuery(engagementsQueries.detail(engagementId));

  const { engagement, deliberations, observations } = data;

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
            {deliberations.map((d) => (
              <DeliberationCard key={d.id} deliberation={d} />
            ))}
          </div>
        </section>
      )}

      {observations.length > 0 && (
        <section className="mt-12 space-y-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Indicateurs liés
          </h2>
          <ul className="space-y-0.5">
            {observations.map((o) => (
              <li key={o.id}>
                <Link
                  to="/indicateurs/$indicateurKey"
                  params={{ indicateurKey: o.key }}
                  className="-mx-3 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <span className="text-sm text-foreground">{indicateurKeyLabels[o.key]}</span>
                  <span className="font-mono text-xs text-muted-foreground">{o.reference}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
