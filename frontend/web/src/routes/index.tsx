import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, ExternalLink } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: HomePage,
});

// À remplacer par l'URL Calaméo du programme
const PROGRAMME_URL = 'https://www.calameo.com/read/008148874f64713b5a1e1';

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

      {/* Sous-titre — centré sur les engagements, pas sur les conseils */}
      <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-xl sm:leading-normal">
        Ce qui a été promis, ce que les décisions et les chiffres en font, et où en est chaque
        engagement aujourd'hui — pièces à l'appui.
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

      {/* Contexte politique — repères factuels sur la mandature en cours */}
      <section className="mt-12 w-full sm:mt-16" aria-labelledby="contexte-heading">
        <div className="mb-5 inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-wider text-muted-foreground sm:text-xs">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          <span>Repères · mandature 2026–2032</span>
        </div>

        <h2 id="contexte-heading" className="text-xl font-semibold tracking-tight sm:text-2xl">
          Qui dirige Poitiers et Grand Poitiers
        </h2>

        <div className="mt-5 rounded-lg border border-border p-5 sm:p-6">
          {/* Emplacement du portrait, une fois les droits obtenus auprès de la mairie */}
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-foreground">Anthony Brottier</p>
            <p className="text-sm text-muted-foreground">
              Liste «&nbsp;Ma priorité, c'est vous&nbsp;»
            </p>
          </div>

          <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Maire de Poitiers
              </dt>
              <dd className="mt-1 text-sm text-foreground">depuis le 27 mars 2026</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Président de Grand Poitiers
              </dt>
              <dd className="mt-1 text-sm text-foreground">depuis le 8 avril 2026</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Conseil municipal
              </dt>
              <dd className="mt-1 text-sm text-foreground">53 élus — 40 majorité, 13 opposition</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Programme de campagne
              </dt>
              <dd className="mt-1 text-sm">
                <a
                  href={PROGRAMME_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  Consulter le programme
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Repères factuels, sourcés et datés.
        </p>
      </section>

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