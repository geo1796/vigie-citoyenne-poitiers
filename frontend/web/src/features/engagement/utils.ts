// Formate une date au format long français (ex. « 26 août 2026 »).
export function formatLongDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
