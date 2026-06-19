import { createFileRoute } from '@tanstack/react-router';
import { engagementsQueries } from '@/features/engagement/api';
import { EngagementPage } from '@/features/engagement/components/EngagementPage';

export const Route = createFileRoute('/engagements/$engagementId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(engagementsQueries.detail(params.engagementId)),
  component: EngagementPage,
});
