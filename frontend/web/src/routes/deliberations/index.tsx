import { createFileRoute } from '@tanstack/react-router';
import { deliberationsQueries } from '@/features/deliberations/api';
import { DeliberationsPage } from '@/features/deliberations/components/DeliberationsPage';
import { listDeliberationsParamsSchema } from '@/features/deliberations/model';

export const Route = createFileRoute('/deliberations/')({
  validateSearch: listDeliberationsParamsSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureInfiniteQueryData(deliberationsQueries.infiniteList(deps.search)),
  component: DeliberationsPage,
});
