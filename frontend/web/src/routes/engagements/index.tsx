import { createFileRoute } from '@tanstack/react-router';
import { engagementsQueries } from '@/features/engagement/api';
import { EngagementsPage } from '@/features/engagement/components/EngagementsPage';
import { listEngagementsParamsSchema } from '@/features/engagement/model';

export const Route = createFileRoute('/engagements/')({
  validateSearch: listEngagementsParamsSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureInfiniteQueryData(engagementsQueries.infiniteList(deps.search)),
  component: EngagementsPage,
});
