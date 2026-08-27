import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader } from '@/shadcn/components/ui/card';
import type { Engagement } from '../model';
import { formatLongDate } from '../utils';
import { EngagementStatusBadge } from './EngagementStatusBadge';

type Props = {
  engagement: Engagement;
};

export function EngagementCard({ engagement: e }: Props) {
  return (
    <Link
      to="/engagements/$engagementId"
      params={{ engagementId: e.id }}
      className="block rounded-lg transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-start gap-3">
            <EngagementStatusBadge status={e.status} />
          </div>
          <h3 className="text-lg font-semibold leading-snug tracking-tight">{e.title}</h3>
          <p className="text-xs text-muted-foreground">Source · {e.reference}</p>
        </CardHeader>

        {e.eventDate && (
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Dernière mise à jour · {formatLongDate(e.eventDate)}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
