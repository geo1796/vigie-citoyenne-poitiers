import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/mentions-legales')({
  component: MentionsLegales,
});

function MentionsLegales() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Informations légales</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Mentions légales</h1>

      <div className="mt-10 space-y-10">
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Éditeur du site
          </h2>
          <p className="text-foreground">
            Le site <span className="font-medium">vigie-citoyenne.fr</span> et son sous-domaine{' '}
            <span className="font-medium">poitiers.vigie-citoyenne.fr</span> sont édités à titre non
            professionnel.
          </p>
          <p className="text-foreground">
            Contact :{' '}
            <a
              href="mailto:contact@vigie-citoyenne.fr"
              className="text-primary underline-offset-4 hover:underline"
            >
              contact@vigie-citoyenne.fr
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            Conformément à l'article 1-1 de la loi pour la confiance dans l'économie numérique
            (LCEN), l'éditeur, personne physique éditant à titre non professionnel, a communiqué son
            identité à son hébergeur, qui la tient à la disposition des autorités judiciaires.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Hébergeur du site
          </h2>
          <p className="text-foreground">
            Les pages du site sont hébergées par la société Scaleway, Société par Actions Simplifiée
            au capital de 142&nbsp;050,00&nbsp;€, immatriculée au RCS de Paris sous le numéro
            433&nbsp;115&nbsp;904, dont le siège social est situé 8, rue de la Ville-l'Évêque, 75008
            Paris, France.
          </p>
          <p className="text-foreground">Téléphone : +33&nbsp;1&nbsp;84&nbsp;13&nbsp;00&nbsp;00</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Hébergeur des données
          </h2>
          <p className="text-foreground">
            Les données traitées par le site sont hébergées par le même prestataire, Scaleway, aux
            coordonnées indiquées ci-dessus.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Nature et objet du site
          </h2>
          <p className="text-foreground">
            La Vigie Citoyenne est un outil de transparence de l'action publique locale sur le
            territoire de Poitiers et de Grand Poitiers. Elle rend lisibles et consultables des
            informations publiques déjà disponibles : délibérations des instances locales et
            indicateurs issus de données ouvertes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Sources des données et propriété intellectuelle
          </h2>
          <p className="text-foreground">
            Les délibérations et les indicateurs présentés sont issus du portail open data de Grand
            Poitiers (data.grandpoitiers.fr) et réutilisés dans le respect de la licence applicable
            à ces jeux de données. Les documents officiels des délibérations affichés sur les fiches
            détaillées sont servis directement par le système de gestion des actes de la
            collectivité, et non hébergés par la Vigie Citoyenne.
          </p>
          <p className="text-foreground">
            La structure du site, son code et ses contenus éditoriaux propres sont la propriété de
            l'éditeur, sauf mention contraire.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Données personnelles
          </h2>
          <p className="text-foreground">
            Dans sa version actuelle, le site ne propose pas de compte utilisateur, ne collecte
            aucune donnée personnelle auprès de ses visiteurs, ne dépose aucun cookie et n'utilise
            aucun outil de mesure d'audience tiers.
          </p>
          <p className="text-foreground">
            Les informations affichées concernant des élus et des représentants sont issues d'actes
            administratifs publics, dans lesquels ces personnes interviennent au titre de leurs
            fonctions. Pour toute question relative à ces informations, l'éditeur peut être contacté
            à l'adresse indiquée plus haut.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Cadre légal</h2>
          <p className="text-sm text-muted-foreground">
            Ces mentions sont établies conformément à l'article 1-1 de la loi n°&nbsp;2004-575 du
            21&nbsp;juin&nbsp;2004 pour la confiance dans l'économie numérique (LCEN), dans sa
            rédaction issue de la loi n°&nbsp;2024-449 du 21&nbsp;mai&nbsp;2024 (loi SREN).
          </p>
        </section>
      </div>
    </div>
  );
}
