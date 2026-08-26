import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { sessionQueryOptions } from '@/features/auth/api';
import { engagementsQueries } from '@/features/engagement/api';
import { EngagementUpdateFormPage } from '@/features/engagement/components/EngagementUpdateFormPage';

export const Route = createFileRoute(
  '/espace-contributeur/engagements/$engagementId/updates/$updateId',
)({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.pathname },
      });
    }
    if (!session.roles.includes('contributeur')) {
      throw redirect({ to: '/espace-contributeur' });
    }
  },
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(engagementsQueries.detail(params.engagementId)),
  component: RouteComponent,
});

function RouteComponent() {
  const { engagementId, updateId } = Route.useParams();
  const { data } = useSuspenseQuery(engagementsQueries.detail(engagementId));
  const update = data.updates.find((u) => u.id === updateId);

  if (!update) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 text-center">
        <p className="text-sm text-muted-foreground">Cette mise à jour est introuvable.</p>
        <Link
          to="/engagements/$engagementId"
          params={{ engagementId }}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Retour à l'engagement
        </Link>
      </div>
    );
  }

  return <EngagementUpdateFormPage engagementId={engagementId} update={update} />;
}
