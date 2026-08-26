import { createFileRoute, redirect } from '@tanstack/react-router';
import { sessionQueryOptions } from '@/features/auth/api';
import { EngagementUpdateFormPage } from '@/features/engagement/components/EngagementUpdateFormPage';

export const Route = createFileRoute(
  '/espace-contributeur/engagements/$engagementId/updates/nouveau',
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
  component: RouteComponent,
});

function RouteComponent() {
  const { engagementId } = Route.useParams();
  return <EngagementUpdateFormPage engagementId={engagementId} />;
}
