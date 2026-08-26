import { useMemo } from 'react';
import {
  type LigneBudget,
  type LigneBudgetCategorie,
  type VentilationAxe,
  ventilationEcartParPoste,
} from './model';

interface Props {
  title: string;
  lignes: LigneBudget[];
  categorie: LigneBudgetCategorie;
  axe: VentilationAxe;
}

const eurosCompact = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'always',
});

export function BudgetEcartTable({ title, lignes, categorie, axe }: Props) {
  const postes = useMemo(
    () => ventilationEcartParPoste(lignes, categorie, axe),
    [lignes, categorie, axe],
  );

  if (postes.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 text-left font-normal">Poste</th>
              <th className="py-2 text-right font-normal">Voté</th>
              <th className="py-2 text-right font-normal">Réalisé</th>
              <th className="py-2 text-right font-normal">Écart</th>
            </tr>
          </thead>
          <tbody>
            {postes.map((p) => {
              const ecartAbsolu = p.realise - p.bp;
              const ecartRelatif = p.bp !== 0 ? ecartAbsolu / p.bp : null;
              return (
                <tr key={p.libelle} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 pr-3 text-muted-foreground">
                    <span className="truncate">{p.libelle}</span>
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-foreground">
                    {eurosCompact.format(p.bp)}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums text-foreground">
                    {p.realise === 0 ? '—' : eurosCompact.format(p.realise)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {ecartRelatif === null || p.realise === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={
                          Math.abs(ecartRelatif) < 0.1
                            ? 'text-muted-foreground'
                            : ecartRelatif < 0
                              ? 'text-foreground'
                              : 'text-foreground'
                        }
                      >
                        {percentFormatter.format(ecartRelatif)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
