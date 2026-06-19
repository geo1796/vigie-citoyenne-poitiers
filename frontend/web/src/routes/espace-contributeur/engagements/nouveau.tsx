import { createFileRoute, redirect } from '@tanstack/react-router';
import { sessionQueryOptions } from '@/features/auth/api';
import { EngagementFormPage } from '@/features/engagement/components/EngagementFormPage';

export const Route = createFileRoute('/espace-contributeur/engagements/nouveau')({
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
  component: EngagementFormPage,
});
