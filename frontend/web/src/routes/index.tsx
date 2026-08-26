import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-4 pb-16 pt-8 sm:px-6 sm:pt-20">
      {/* Eyebrow — pose le territoire avant même le titre */}
      <div className="mb-5 inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-wider text-muted-foreground sm:mb-6 sm:text-xs">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
        <span>Une vigie citoyenne pour Poitiers et Grand Poitiers</span>
      </div>

      {/* Titre principal */}
      <h1 className="text-balance text-3xl font-semibold leading-[1.15] tracking-tight sm:text-5xl sm:leading-[1.1]">
        Comprendre ce qui se décide à Poitiers et&nbsp;Grand&nbsp;Poitiers, sans avoir à
        le&nbsp;déchiffrer.
      </h1>

      {/* Sous-titre — la promesse opérationnelle */}
      <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-xl sm:leading-normal">
        Délibérations, indicateurs, engagements&nbsp;: l'activité de vos conseils municipaux et
        communautaires, rendue lisible et consultable.
      </p>

      {/* CTAs */}
      <div className="mt-8 flex w-full flex-col items-stretch gap-4 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
        <Link
          to="/engagements"
          className="group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:justify-start"
        >
          Voir les engagements
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>

        <Link
          to="/about"
          className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:text-left"
        >
          En savoir plus sur la Vigie
        </Link>
      </div>

      {/* Pied de page éditorial — pose la neutralité */}
      <div className="mt-16 max-w-2xl border-t border-border pt-6 sm:mt-20 sm:pt-8">
        <p className="text-sm leading-relaxed text-muted-foreground">
          La Vigie Citoyenne agrège et met en récit des données publiques déjà accessibles. Elle est
          pensée comme un bien commun numérique local, utile quelle que soit la majorité en place.
          Sa gouvernance est appelée à évoluer pour accueillir d'autres contributeurs civiques.
        </p>
      </div>
    </div>
  );
}
