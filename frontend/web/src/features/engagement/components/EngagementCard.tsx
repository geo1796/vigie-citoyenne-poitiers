import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader } from '@/shadcn/components/ui/card';
import type { Engagement } from '../model';
import { EngagementStatusBadge } from './EngagementStatusBadge';

type Props = {
  engagement: Engagement;
};

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function EngagementCard({ engagement: e }: Props) {
  return (
    <Link
      to="/engagements/$engagementId"
      params={{ engagementId: e.id }}
      className="block rounded-lg transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Engagement</div>
            <EngagementStatusBadge status={e.status} />
          </div>
          <h3 className="text-lg font-semibold leading-snug tracking-tight">{e.title}</h3>
        </CardHeader>

        <CardContent>
          <div className="text-xs text-muted-foreground">Ajouté le {formatDate(e.createdAt)}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
