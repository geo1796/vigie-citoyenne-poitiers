import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useRouter } from '@tanstack/react-router';
import { ArrowLeft, ExternalLink, Plus } from 'lucide-react';
import { useSession } from '@/features/auth/api';
import { DeliberationCard } from '@/features/deliberations/components/DeliberationCard';
import { Route } from '@/routes/engagements/$engagementId';
import { Button } from '@/shadcn/components/ui/button';
import { engagementsQueries } from '../api';
import type { EngagementUpdate } from '../model';
import { formatLongDate } from '../utils';
import { EngagementStatusBadge } from './EngagementStatusBadge';

function UpdateItem({ update }: { update: EngagementUpdate }) {
  return (
    <li className="border-l-2 border-border pl-4">
      <div className="flex flex-wrap items-center gap-2">
        <EngagementStatusBadge status={update.status} />
        <span className="text-xs text-muted-foreground">{formatLongDate(update.eventDate)}</span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {update.content}
      </p>

      {update.deliberation && (
        <div className="mt-4">
          <DeliberationCard deliberation={update.deliberation} />
        </div>
      )}

      {update.externalSource && (
        <a
          href={update.externalSource}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
        >
          <ExternalLink className="size-3.5" />
          Source externe
        </a>
      )}
    </li>
  );
}

export function EngagementPage() {
  const { engagementId } = Route.useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const isContributeur = session?.roles.includes('contributeur') ?? false;
  const { data } = useSuspenseQuery(engagementsQueries.detail(engagementId));

  const { engagement, updates } = data;

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
        Retour
      </button>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {engagement.eventDate && (
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Dernière mise à jour · {formatLongDate(engagement.eventDate)}
          </div>
        )}
        <EngagementStatusBadge status={engagement.status} />
      </div>

      <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">
        {engagement.title}
      </h1>

      <section className="mt-12 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Suivi</h2>
          {isContributeur && (
            <Button
              size="sm"
              variant="outline"
              render={
                <Link
                  to="/espace-contributeur/engagements/$engagementId/updates/nouveau"
                  params={{ engagementId }}
                >
                  <Plus className="size-4" />
                  Ajouter une mise à jour
                </Link>
              }
            />
          )}
        </div>

        {updates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune mise à jour n'a encore été enregistrée pour cet engagement.
          </p>
        ) : (
          <ul className="space-y-8">
            {updates.map((u) => (
              <UpdateItem key={u.id} update={u} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
