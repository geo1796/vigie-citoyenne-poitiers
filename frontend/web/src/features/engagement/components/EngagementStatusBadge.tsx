import { Badge } from '@/shadcn/components/ui/badge';
import { cn } from '@/shadcn/lib/utils';
import { type EngagementStatus, engagementStatusLabels } from '../model';

const statusStyles: Record<EngagementStatus, string> = {
  en_attente: 'bg-muted text-muted-foreground',
  en_cours: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  tenu: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  rompu: 'bg-destructive/10 text-destructive',
};

type Props = {
  status: EngagementStatus;
  className?: string;
};

export function EngagementStatusBadge({ status, className }: Props) {
  return (
    <Badge className={cn(statusStyles[status], className)}>{engagementStatusLabels[status]}</Badge>
  );
}
