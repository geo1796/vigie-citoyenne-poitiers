import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/shadcn/components/ui/select";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@/shadcn/components/ui/toggle-group";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/shadcn/components/ui/tooltip";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useMemo } from "react";
import type { Observation } from "../../model";
import { BudgetDonut } from "./BudgetDonut";
import { BudgetEcartTable } from "./BudgetEcartTable";
import {
	type BudgetBase,
	budgetObservationDataSchema,
	type LigneBudget,
	type VentilationAxe,
	ventilationAxeLabels,
} from "./model";

interface Props {
	observations: Observation[];
}

interface ParsedExercice {
	reference: string;
	lignes: LigneBudget[];
}

const AXE_DEFAULT: VentilationAxe = "budget";
const BASE_DEFAULT: BudgetBase = "realise";

export function BudgetIndicateur({ observations }: Props) {
	const exercices = useMemo<ParsedExercice[]>(() => {
		return observations
			.map((obs) => ({
				reference: obs.reference,
				lignes: budgetObservationDataSchema.parse(obs.data).lignes,
			}))
			.sort((a, b) => b.reference.localeCompare(a.reference));
	}, [observations]);

	const search = useSearch({ from: "/indicateurs/$indicateurKey" });
	const navigate = useNavigate({ from: "/indicateurs/$indicateurKey" });

	const selected = useMemo(() => {
		if (
			search.exercice &&
			exercices.some((e) => e.reference === search.exercice)
		) {
			return search.exercice;
		}
		return exercices[0]?.reference ?? "";
	}, [search.exercice, exercices]);

	const axe = search.axe ?? AXE_DEFAULT;
	const base = search.base ?? BASE_DEFAULT;

	const exercice = exercices.find((e) => e.reference === selected);

	if (exercices.length === 0) {
		return (
			<p className="text-muted-foreground">
				Aucune donnée budgétaire disponible.
			</p>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex items-center gap-3">
				<label
					htmlFor="exercice-select"
					className="text-xs uppercase tracking-wider text-muted-foreground"
				>
					Exercice
				</label>
				<Select
					value={selected}
					onValueChange={(value) => {
						if (value === null) return;
						navigate({
							search: (prev) => ({ ...prev, exercice: value }),
						});
					}}
				>
					<SelectTrigger id="exercice-select" className="w-32">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{exercices.map((e) => (
							<SelectItem key={e.reference} value={e.reference}>
								{e.reference}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{exercice && (
				<ExerciceView
					key={exercice.reference}
					lignes={exercice.lignes}
					axe={axe}
					onAxeChange={(nextAxe) => {
						navigate({
							search: (prev) => ({ ...prev, axe: nextAxe }),
						});
					}}
					base={base}
					onBaseChange={(nextBase) => {
						navigate({
							search: (prev) => ({ ...prev, base: nextBase }),
						});
					}}
				/>
			)}
		</div>
	);
}

function ExerciceView({
	lignes,
	axe,
	onAxeChange,
	base,
	onBaseChange,
}: {
	lignes: LigneBudget[];
	axe: VentilationAxe;
	onAxeChange: (axe: VentilationAxe) => void;
	base: BudgetBase;
	onBaseChange: (base: BudgetBase) => void;
}) {
	// Mode adaptatif : s'il y a au moins une ligne réalisée, on est en
	// mode « réalisé » (vue analytique complète). Sinon en mode « primitif »
	// (vue prévisionnelle, exercice non encore clôturé ou réalisé non publié).
	const aDuRealise = lignes.some((l) => l.realise !== null);

	return aDuRealise ? (
		<ExerciceViewRealise
			lignes={lignes}
			axe={axe}
			onAxeChange={onAxeChange}
			base={base}
			onBaseChange={onBaseChange}
		/>
	) : (
		<ExerciceViewPrimitif lignes={lignes} axe={axe} onAxeChange={onAxeChange} />
	);
}

function AxeToggle({
	axe,
	onAxeChange,
}: {
	axe: VentilationAxe;
	onAxeChange: (axe: VentilationAxe) => void;
}) {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<span className="text-xs uppercase tracking-wider text-muted-foreground">
				Répartition
			</span>
			<ToggleGroup
				value={[axe]}
				onValueChange={(value) => {
					const next = value[0];
					if (next) onAxeChange(next as VentilationAxe);
				}}
				variant="outline"
				size="sm"
			>
				<ToggleGroupItem value="budget">
					{ventilationAxeLabels.budget}
				</ToggleGroupItem>
				<ToggleGroupItem value="chapitre">
					{ventilationAxeLabels.chapitre}
				</ToggleGroupItem>
				<ToggleGroupItem value="fonction">
					{ventilationAxeLabels.fonction}
				</ToggleGroupItem>
			</ToggleGroup>
		</div>
	);
}

function ExerciceViewRealise({
	lignes,
	axe,
	onAxeChange,
	base,
	onBaseChange,
}: {
	lignes: LigneBudget[];
	axe: VentilationAxe;
	onAxeChange: (axe: VentilationAxe) => void;
	base: BudgetBase;
	onBaseChange: (base: BudgetBase) => void;
}) {
	const enRealise = base === "realise";

	const totalRecettes = sumRealise(lignes, "recettes");
	const totalDepenses = sumRealise(lignes, "depenses");
	const solde = totalRecettes - totalDepenses;

	const totalRecettesBP = sumBP(lignes, "recettes");
	const totalDepensesBP = sumBP(lignes, "depenses");
	const equilibre = totalRecettesBP - totalDepensesBP;

	const tauxExecution =
		totalDepensesBP > 0 ? totalDepenses / totalDepensesBP : null;

	return (
		<div className="space-y-10">
			<BaseToggle base={base} onBaseChange={onBaseChange} />

			{enRealise ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<KeyFigure label="Recettes réalisées" value={totalRecettes} />
					<KeyFigure label="Dépenses réalisées" value={totalDepenses} />
					<KeyFigure label="Solde" value={solde} signed />
					<KeyFigurePercent
						label="Taux d'exécution"
						value={tauxExecution}
						tooltip="Part du budget primitif voté qui a été effectivement dépensée."
					/>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-3">
					<KeyFigure label="Recettes votées" value={totalRecettesBP} />
					<KeyFigure label="Dépenses votées" value={totalDepensesBP} />
					<KeyFigure label="Équilibre" value={equilibre} signed />
				</div>
			)}

			<div className="space-y-6">
				<AxeToggle axe={axe} onAxeChange={onAxeChange} />

				<div className="grid gap-8 lg:grid-cols-2">
					<BudgetDonut
						title={enRealise ? "Recettes" : "Recettes votées"}
						lignes={lignes}
						categorie="recettes"
						axe={axe}
						useBP={!enRealise}
					/>
					<BudgetDonut
						title={enRealise ? "Dépenses" : "Dépenses votées"}
						lignes={lignes}
						categorie="depenses"
						axe={axe}
						useBP={!enRealise}
					/>
				</div>
			</div>

			<div className="space-y-8">
				<BudgetEcartTable
					title="Détail recettes (voté / réalisé)"
					lignes={lignes}
					categorie="recettes"
					axe={axe}
				/>
				<BudgetEcartTable
					title="Détail dépenses (voté / réalisé)"
					lignes={lignes}
					categorie="depenses"
					axe={axe}
				/>
			</div>
		</div>
	);
}

function ExerciceViewPrimitif({
	lignes,
	axe,
	onAxeChange,
}: {
	lignes: LigneBudget[];
	axe: VentilationAxe;
	onAxeChange: (axe: VentilationAxe) => void;
}) {
	const totalRecettesBP = sumBP(lignes, "recettes");
	const totalDepensesBP = sumBP(lignes, "depenses");
	const equilibre = totalRecettesBP - totalDepensesBP;

	return (
		<div className="space-y-10">
			<div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
				<span className="font-medium text-foreground">
					Exercice non clôturé.
				</span>{" "}
				<span className="text-muted-foreground">
					Seul le budget primitif voté est disponible — les montants réalisés
					n'ont pas encore été publiés par la collectivité.
				</span>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<KeyFigure label="Recettes prévues" value={totalRecettesBP} />
				<KeyFigure label="Dépenses prévues" value={totalDepensesBP} />
				<KeyFigure label="Équilibre" value={equilibre} signed />
			</div>

			<div className="space-y-6">
				<AxeToggle axe={axe} onAxeChange={onAxeChange} />

				<div className="grid gap-8 lg:grid-cols-2">
					<BudgetDonut
						title="Recettes prévues"
						lignes={lignes}
						categorie="recettes"
						axe={axe}
						useBP
					/>
					<BudgetDonut
						title="Dépenses prévues"
						lignes={lignes}
						categorie="depenses"
						axe={axe}
						useBP
					/>
				</div>
			</div>
		</div>
	);
}

function KeyFigure({
	label,
	value,
	signed = false,
}: {
	label: string;
	value: number;
	signed?: boolean;
}) {
	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<div className="text-xs uppercase tracking-wider text-muted-foreground">
				{label}
			</div>
			<div className="mt-1 text-xl font-semibold tabular-nums text-foreground">
				{signed && value > 0 ? "+" : ""}
				{formatEuros(value)}
			</div>
		</div>
	);
}

function BaseToggle({
	base,
	onBaseChange,
}: {
	base: BudgetBase;
	onBaseChange: (base: BudgetBase) => void;
}) {
	return (
		<div className="flex flex-wrap items-center gap-3">
			<span className="text-xs uppercase tracking-wider text-muted-foreground">
				Base
			</span>
			<ToggleGroup
				value={[base]}
				onValueChange={(value) => {
					const next = value[0];
					if (next) onBaseChange(next as BudgetBase);
				}}
				variant="outline"
				size="sm"
			>
				<ToggleGroupItem value="realise">Réalisé</ToggleGroupItem>
				<ToggleGroupItem value="vote">Voté</ToggleGroupItem>
			</ToggleGroup>
		</div>
	);
}

function sumRealise(
	lignes: LigneBudget[],
	categorie: LigneBudget["categorie"],
) {
	return lignes
		.filter((l) => l.categorie === categorie)
		.reduce((acc, l) => acc + (l.realise ?? 0), 0);
}

function sumBP(lignes: LigneBudget[], categorie: LigneBudget["categorie"]) {
	return lignes
		.filter((l) => l.categorie === categorie)
		.reduce((acc, l) => acc + l.totalBP, 0);
}

function KeyFigurePercent({
	label,
	value,
	tooltip,
}: {
	label: string;
	value: number | null;
	tooltip?: string;
}) {
	return (
		<div className="rounded-lg border border-border bg-card p-4">
			<div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
				<span>{label}</span>
				{tooltip && (
					<Tooltip>
						<TooltipTrigger
							render={
								<button
									type="button"
									className="text-muted-foreground/60 hover:text-muted-foreground"
									aria-label={`À propos de ${label}`}
								>
									<Info className="size-3.5" />
								</button>
							}
						/>
						<TooltipContent className="max-w-xs text-xs">
							{tooltip}
						</TooltipContent>
					</Tooltip>
				)}
			</div>
			<div className="mt-1 text-xl font-semibold tabular-nums text-foreground">
				{value === null
					? "—"
					: new Intl.NumberFormat("fr-FR", {
							style: "percent",
							maximumFractionDigits: 0,
						}).format(value)}
			</div>
		</div>
	);
}

const eurosFormatter = new Intl.NumberFormat("fr-FR", {
	style: "currency",
	currency: "EUR",
	maximumFractionDigits: 0,
});

function formatEuros(value: number): string {
	return eurosFormatter.format(value);
}
