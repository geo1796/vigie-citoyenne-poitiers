import { Button } from "@/shadcn/components/ui/button";
import { Calendar } from "@/shadcn/components/ui/calendar";
import { Checkbox } from "@/shadcn/components/ui/checkbox";
import { Input } from "@/shadcn/components/ui/input";
import { Label } from "@/shadcn/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/shadcn/components/ui/popover";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@/shadcn/components/ui/toggle-group";
import { cn } from "@/shadcn/lib/utils";
import { getRouteApi } from "@tanstack/react-router";
import { CalendarIcon, RotateCcw, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
	type Collectivite,
	collectiviteLabels,
	collectiviteSchema,
	type Instance,
	instanceLabels,
	instanceSchema,
	type ListDeliberationsParams,
} from "../model";

type Props = {
	params: ListDeliberationsParams;
};

const DEBOUNCE_MS = 300;

const collectivites: Collectivite[] = collectiviteSchema.options;
const instances: Instance[] = instanceSchema.options;

const route = getRouteApi("/deliberations/");

function formatDateLabel(d: Date): string {
	return d.toLocaleDateString("fr-FR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

export function DeliberationsFilter({ params }: Props) {
	const navigate = route.useNavigate();
	const [searchInput, setSearchInput] = useState(params.search ?? "");

	useEffect(() => {
		setSearchInput(params.search ?? "");
	}, [params.search]);

	useEffect(() => {
		const current = params.search ?? "";
		if (searchInput === current) return;

		const timeout = setTimeout(() => {
			navigate({
				search: (prev) => ({
					...prev,
					search: searchInput || undefined,
					offset: 0,
				}),
			});
		}, DEBOUNCE_MS);

		return () => clearTimeout(timeout);
	}, [searchInput, params.search, navigate]);

	const updateSearch = (update: Partial<ListDeliberationsParams>) => {
		navigate({
			search: (prev) => ({
				...prev,
				...update,
				offset: 0,
			}),
		});
	};

	const resetAll = () => {
		setSearchInput("");
		navigate({
			search: () => ({
				limit: 25,
				offset: 0,
				sortAsc: false,
			}),
		});
	};

	const activeCount =
		(params.collectivites?.length ?? 0) +
		(params.instances?.length ?? 0) +
		(params.dateFrom ? 1 : 0) +
		(params.dateTo ? 1 : 0);

	const hasAnyFilter = Boolean(params.search) || activeCount > 0;

	const sortValue = params.sortAsc ? "asc" : "desc";

	return (
		<div className="space-y-6 py-4">
			{/* Recherche */}
			<div className="space-y-2">
				<Label
					htmlFor="deliberations-search"
					className="text-xs uppercase tracking-wider text-muted-foreground"
				>
					Recherche
				</Label>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="deliberations-search"
						type="search"
						placeholder="Mots-clés…"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="pl-9"
					/>
					{searchInput && (
						<button
							type="button"
							onClick={() => setSearchInput("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							aria-label="Effacer la recherche"
						>
							<X className="size-4" />
						</button>
					)}
				</div>
			</div>

			{/* Tri */}
			<div className="space-y-2">
				<Label className="text-xs uppercase tracking-wider text-muted-foreground">
					Tri
				</Label>
				<ToggleGroup
					value={[sortValue]}
					onValueChange={(value: string[]) => {
						const next = value[value.length - 1];
						if (!next) return;
						updateSearch({ sortAsc: next === "asc" });
					}}
					variant="outline"
					size="sm"
					className="flex-wrap justify-start"
				>
					<ToggleGroupItem value="desc" aria-label="Plus récent en premier">
						Plus récent
					</ToggleGroupItem>
					<ToggleGroupItem value="asc" aria-label="Moins récent en premier">
						Moins récent
					</ToggleGroupItem>
				</ToggleGroup>
			</div>

			{/* Collectivités */}
			<div className="space-y-2">
				<Label className="text-xs uppercase tracking-wider text-muted-foreground">
					Collectivités
				</Label>
				<ToggleGroup
					value={params.collectivites ?? []}
					onValueChange={(value: string[]) =>
						updateSearch({
							collectivites: value.length
								? (value as Collectivite[])
								: undefined,
						})
					}
					variant="outline"
					size="sm"
					className="flex-wrap justify-start"
				>
					{collectivites.map((c) => (
						<ToggleGroupItem
							key={c}
							value={c}
							aria-label={collectiviteLabels[c]}
						>
							{collectiviteLabels[c]}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>

			{/* Instances */}
			<div className="space-y-3">
				<Label className="text-xs uppercase tracking-wider text-muted-foreground">
					Instances
				</Label>
				<div className="space-y-2">
					{instances.map((i) => {
						const checked = params.instances?.includes(i) ?? false;
						const id = `instance-${i}`;
						return (
							<div key={i} className="flex items-center gap-2">
								<Checkbox
									id={id}
									checked={checked}
									onCheckedChange={(value) => {
										const current = params.instances ?? [];
										const next =
											value === true
												? [...current, i]
												: current.filter((x) => x !== i);
										updateSearch({
											instances: next.length ? next : undefined,
										});
									}}
								/>
								<label
									htmlFor={id}
									className="text-sm cursor-pointer select-none"
								>
									{instanceLabels[i]}
								</label>
							</div>
						);
					})}
				</div>
			</div>

			{/* Période */}
			<div className="space-y-2">
				<Label className="text-xs uppercase tracking-wider text-muted-foreground">
					Période
				</Label>
				<div className="space-y-2">
					<DatePicker
						value={params.dateFrom}
						onChange={(date) => updateSearch({ dateFrom: date })}
						placeholder="Du"
					/>
					<DatePicker
						value={params.dateTo}
						onChange={(date) => updateSearch({ dateTo: date })}
						placeholder="Au"
					/>
				</div>
			</div>

			{/* Reset */}
			{hasAnyFilter && (
				<Button
					variant="ghost"
					size="sm"
					onClick={resetAll}
					className="w-full justify-start text-muted-foreground"
				>
					<RotateCcw className="size-4" />
					Réinitialiser les filtres
					{activeCount > 0 && (
						<span className="ml-auto rounded-sm bg-muted px-1.5 py-0.5 text-xs">
							{activeCount}
						</span>
					)}
				</Button>
			)}
		</div>
	);
}

type DatePickerProps = {
	value: Date | undefined;
	onChange: (date: Date | undefined) => void;
	placeholder: string;
};

function DatePicker({ value, onChange, placeholder }: DatePickerProps) {
	return (
		<Popover>
			<PopoverTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						className={cn(
							"w-full justify-start font-normal",
							!value && "text-muted-foreground",
						)}
					>
						<CalendarIcon className="size-4" />
						{value ? formatDateLabel(value) : placeholder}
					</Button>
				}
			/>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={value}
					onSelect={onChange}
					autoFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
