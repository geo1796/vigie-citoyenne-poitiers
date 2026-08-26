import { createFileRoute } from '@tanstack/react-router';
import { indicateursQueries } from '@/features/indicateurs/api';
import { IndicateursPage } from '@/features/indicateurs/components/IndicateurPage';

export const Route = createFileRoute('/indicateurs/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(indicateursQueries.list()),
  component: IndicateursPage,
});
