import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
			<article className="space-y-12">
				<header className="space-y-6">
					<p className="text-xs uppercase tracking-wider text-muted-foreground">
						À propos
					</p>
					<h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
						Une vigie citoyenne de l'action publique locale
					</h1>
					<div className="space-y-4 text-base leading-relaxed text-foreground/90">
						<p>
							La Vigie Citoyenne de Poitiers est un outil numérique de suivi de
							l'action publique locale, à destination des habitants du bassin de
							vie poitevin. Elle ingère les données publiques publiées par les
							collectivités, les rend lisibles par des non-spécialistes, et
							permettra à terme d'y ajouter une couche de mise en récit qui en
							éclaire la portée politique.
						</p>
						<p>
							L'action publique locale repose largement sur des informations
							publiques (délibérations des conseils, jeux de données ouverts,
							comptes administratifs...) mais ces informations restent dispersées,
							présentées sous forme technique ou juridique, et ne racontent
							aucune histoire par elles-mêmes. La Vigie n'invente rien : elle
							rend accessible et intelligible ce qui existe déjà.
						</p>
					</div>
				</header>

				<section className="space-y-4">
					<h2 className="text-xs uppercase tracking-wider text-muted-foreground">
						Périmètre institutionnel
					</h2>
					<p className="text-base leading-relaxed text-foreground/90">
						La Vigie couvre simultanément la Ville de Poitiers et la communauté
						urbaine de Grand Poitiers, qui regroupe quarante communes. Une part
						importante des compétences structurantes (mobilité, habitat,
						environnement, énergie, déchets...) relève de la maille intercommunale
						plutôt que de la seule ville-centre. Chaque élément exposé par la
						Vigie est étiqueté avec l'instance dont il émane, afin que la
						provenance institutionnelle d'une information ne soit jamais
						masquée.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-xs uppercase tracking-wider text-muted-foreground">
						État d'avancement
					</h2>
					<div className="space-y-4 text-base leading-relaxed text-foreground/90">
						<p>
							Cette première mise en ligne donne accès au module Délibérations, qui
							rend explorables les délibérations du conseil municipal de
							Poitiers, du conseil communautaire de Grand Poitiers et du bureau
							communautaire. Les délibérations sont ingérées depuis le portail
							open data de Grand Poitiers, où elles sont publiées au standard
							SCDL (Socle Commun des Données Locales) et mises à jour de façon
							hebdomadaire.
						</p>
						<p>
							Le module Indicateurs, qui documentera l'évolution de grandeurs
							chiffrées sur la durée du mandat (budget, couverture arborée,
							aménagements cyclables, logement social, subventions associatives,
							fréquentation du centre-ville, signalements sur l'espace public...)
							est en cours de développement et sera intégré dans
							une version ultérieure. Conformément à l'approche retenue, ces
							indicateurs fournissent du contexte sur des trajectoires, et ne
							prétendent pas établir de rapports de causalité avec les décisions
							politiques.
						</p>
						<p>
							Deux modules éditoriaux complémentaires (Engagements et
							Nominations) sont prévus dans les versions suivantes. Ils
							nécessitent une infrastructure de contribution humaine qui n'est
							pas encore en place. Le premier documentera les promesses
							publiques et leur trajectoire d'exécution ; le second
							cartographiera les désignations dans les satellites de la
							collectivité.
						</p>
					</div>
				</section>

				{/* <section className="space-y-4">
					<h2 className="text-xs uppercase tracking-wider text-muted-foreground">
						Origine et positionnement
					</h2>
					<div className="space-y-4 text-base leading-relaxed text-foreground/90">
						<p>
							La Vigie a été conçue au printemps 2026, dans le contexte du début
							du mandat municipal en cours. Le projet a été initialement
							présenté à des acteurs politiques et associatifs locaux, dont
							certains ont exprimé leur intérêt sans pouvoir s'y associer
							immédiatement. Il est aujourd'hui porté en solo par un habitant de
							Poitiers, à titre bénévole.
						</p>
						<p>
							Cette origine ne définit pas la nature de l'outil sur le long
							terme. La Vigie a vocation à être un bien commun numérique local,
							utile quelle que soit la configuration politique du moment et
							pensé pour survivre aux alternances. Une distinction structurelle
							est maintenue entre la plateforme technique, qui reste neutre par
							construction, et les contenus éditoriaux qui l'alimenteront à
							mesure que la couche de contribution s'ouvrira — contenus qui
							seront signés par leurs auteurs et clairement identifiables comme
							tels.
						</p>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xs uppercase tracking-wider text-muted-foreground">
						Moyens et gouvernance
					</h2>
					<div className="space-y-4 text-base leading-relaxed text-foreground/90">
						<p>
							Le projet est développé sans budget dédié, sans structure
							juridique propre, et sans soutien institutionnel. Les coûts
							d'infrastructure restent négligeables à l'échelle envisagée. Le
							code source est conçu pour être ouvert et réplicable, dans une
							logique de bien commun numérique : si l'outil fait ses preuves à
							Poitiers, rien ne s'oppose à ce qu'il serve à d'autres
							collectivités.
						</p>
						<p>
							Les questions de gouvernance — modèle de contribution, cadre
							éthique, pérennité, périmètre territorial à long terme — sont
							posées explicitement dans la documentation de conception du projet
							et ont vocation à être tranchées progressivement, avec les
							partenaires effectifs qui rejoindront la démarche.
						</p>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-xs uppercase tracking-wider text-muted-foreground">
						Contact
					</h2>
					<p className="text-base leading-relaxed text-foreground/90">
						Pour toute remarque, signalement d'erreur ou proposition de
						contribution :{" "}
						<a
							href="mailto:contact@vigie-citoyenne-poitiers.fr"
							className="text-accent underline-offset-4 hover:underline"
						>
							contact@vigie-citoyenne-poitiers.fr
						</a>
					</p>
				</section> */}
			</article>
		</div>
	);
}
