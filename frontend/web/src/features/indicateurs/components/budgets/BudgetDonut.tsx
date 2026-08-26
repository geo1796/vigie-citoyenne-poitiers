import { Info } from 'lucide-react';
import { useMemo } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import type { ChartConfig } from '@/shadcn/components/ui/chart';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shadcn/components/ui/chart';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shadcn/components/ui/tooltip';
import {
  type LigneBudget,
  type LigneBudgetCategorie,
  type VentilationAxe,
  ventilationParPoste,
} from './model';

interface Props {
  title: string;
  lignes: LigneBudget[];
  categorie: LigneBudgetCategorie;
  axe: VentilationAxe;
  useBP?: boolean;
}

const CHART_VARS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--muted-foreground)',
  'var(--border)',
];

const eurosCompact = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function BudgetDonut({ title, lignes, categorie, axe, useBP }: Props) {
  const parts = useMemo(
    () => ventilationParPoste(lignes, categorie, axe, { useBP }),
    [lignes, categorie, axe, useBP],
  );

  const total = useMemo(() => parts.reduce((acc, p) => acc + p.montant, 0), [parts]);

  const chartData = useMemo(
    () =>
      parts.map((p, i) => ({
        libelle: p.libelle,
        montant: p.montant,
        fill: CHART_VARS[i % CHART_VARS.length],
      })),
    [parts],
  );

  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = { montant: { label: 'Montant' } };
    for (const [i, p] of parts.entries()) {
      cfg[p.libelle] = {
        label: p.libelle,
        color: CHART_VARS[i % CHART_VARS.length],
      };
    }
    return cfg;
  }, [parts]);

  if (parts.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <p className="py-12 text-center text-sm text-muted-foreground">
          Données non disponibles pour cet exercice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>

      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-65">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-medium tabular-nums">
                      {eurosCompact.format(value as number)}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="montant"
            nameKey="libelle"
            innerRadius={60}
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.libelle} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">
          {useBP ? 'Total prévu : ' : 'Total réalisé : '}
        </span>
        <span className="font-medium tabular-nums text-foreground">
          {eurosCompact.format(total)}
        </span>
      </div>

      <dl className="space-y-1 text-sm">
        {chartData.map((p) => (
          <div key={p.libelle} className="flex items-baseline justify-between gap-3">
            <dt className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-xs" style={{ backgroundColor: p.fill }} />
              <span className="truncate text-muted-foreground">{p.libelle}</span>
              {p.libelle === 'Non ventilé' && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className="text-muted-foreground/60 hover:text-muted-foreground"
                        aria-label="À propos du segment Non ventilé"
                      >
                        <Info className="size-3.5" />
                      </button>
                    }
                  />
                  <TooltipContent className="max-w-xs text-xs">
                    Lignes du budget sans information pour cet axe dans l'open data source. Elles
                    sont comptabilisées dans le total ci-dessus mais ne peuvent pas être ventilées
                    sur cette dimension.
                  </TooltipContent>
                </Tooltip>
              )}
            </dt>
            <dd className="shrink-0 tabular-nums text-foreground">
              {total > 0 ? `${((p.montant / total) * 100).toFixed(1)} %` : '—'}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
