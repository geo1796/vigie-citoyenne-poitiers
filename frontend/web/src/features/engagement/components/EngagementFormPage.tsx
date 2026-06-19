import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { deliberationsQueries } from '@/features/deliberations/api';
import type { Deliberation } from '@/features/deliberations/model';
import { instanceLabels } from '@/features/deliberations/model';
import { indicateursQueries } from '@/features/indicateurs/api';
import {
  type IndicateurKey,
  indicateurKeyLabels,
  indicateurKeySchema,
  type Observation,
} from '@/features/indicateurs/model';
import { Button } from '@/shadcn/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shadcn/components/ui/field';
import { Input } from '@/shadcn/components/ui/input';
import { Textarea } from '@/shadcn/components/ui/textarea';
import { useCreateEngagement } from '../api';
import { createEngagementInputSchema } from '../model';

const DEBOUNCE_MS = 300;

function DeliberationPicker({
  selected,
  onToggle,
}: {
  selected: Deliberation[];
  onToggle: (d: Deliberation) => void;
}) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(input.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [input]);

  const { data, isFetching } = useQuery({
    ...deliberationsQueries.list({ search: search || undefined, limit: 10 }),
    enabled: search.length > 0,
  });

  const selectedIds = new Set(selected.map((d) => d.id));
  const results = (data?.items ?? []).filter((d) => !selectedIds.has(d.id));

  return (
    <div className="space-y-3">
      <Input
        type="search"
        placeholder="Rechercher une délibération par mots-clés…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      {search.length > 0 && (
        <div className="rounded-lg border border-border">
          {isFetching && <p className="px-3 py-2 text-sm text-muted-foreground">Recherche…</p>}
          {!isFetching && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat.</p>
          )}
          {results.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onToggle(d)}
              className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted"
            >
              <span className="text-sm leading-snug">{d.delibObjet}</span>
              <span className="text-xs text-muted-foreground">
                {instanceLabels[d.instance]} · {d.delibDate.toLocaleDateString('fr-FR')}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <ul className="space-y-1.5">
          {selected.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-1.5"
            >
              <span className="truncate text-sm">{d.delibObjet}</span>
              <button
                type="button"
                onClick={() => onToggle(d)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Retirer"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ObservationPicker({
  selected,
  onToggle,
}: {
  selected: Observation[];
  onToggle: (o: Observation) => void;
}) {
  const [activeKey, setActiveKey] = useState<IndicateurKey | null>(null);
  const keys = indicateurKeySchema.options;

  const { data, isFetching } = useQuery({
    ...indicateursQueries.observations(activeKey as IndicateurKey),
    enabled: activeKey !== null,
  });

  const selectedIds = new Set(selected.map((o) => o.id));
  const results = (data ?? []).filter((o) => !selectedIds.has(o.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {keys.map((key) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={activeKey === key ? 'default' : 'outline'}
            onClick={() => setActiveKey(activeKey === key ? null : key)}
          >
            {indicateurKeyLabels[key]}
          </Button>
        ))}
      </div>

      {activeKey !== null && (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
          {isFetching && <p className="px-3 py-2 text-sm text-muted-foreground">Chargement…</p>}
          {!isFetching && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Aucune observation disponible.
            </p>
          )}
          {results.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onToggle(o)}
              className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted"
            >
              <span className="text-sm">{indicateurKeyLabels[o.key]}</span>
              <span className="font-mono text-xs text-muted-foreground">{o.reference}</span>
            </button>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <ul className="space-y-1.5">
          {selected.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-1.5"
            >
              <span className="truncate text-sm">
                {indicateurKeyLabels[o.key]}{' '}
                <span className="font-mono text-xs text-muted-foreground">{o.reference}</span>
              </span>
              <button
                type="button"
                onClick={() => onToggle(o)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Retirer"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EngagementFormPage() {
  const navigate = useNavigate();
  const create = useCreateEngagement();

  const [selectedDelibs, setSelectedDelibs] = useState<Deliberation[]>([]);
  const [selectedObs, setSelectedObs] = useState<Observation[]>([]);

  const toggleDelib = (d: Deliberation) =>
    setSelectedDelibs((prev) =>
      prev.some((x) => x.id === d.id) ? prev.filter((x) => x.id !== d.id) : [...prev, d],
    );

  const toggleObs = (o: Observation) =>
    setSelectedObs((prev) =>
      prev.some((x) => x.id === o.id) ? prev.filter((x) => x.id !== o.id) : [...prev, o],
    );

  const form = useForm({
    defaultValues: { title: '', content: '' },
    validators: {
      onSubmit: createEngagementInputSchema.pick({
        title: true,
        content: true,
      }),
    },
    onSubmit: async ({ value }) => {
      create.mutate(
        {
          title: value.title,
          content: value.content,
          deliberationIds: selectedDelibs.map((d) => d.id),
          observationIds: selectedObs.map((o) => o.id),
        },
        {
          onSuccess: (engagement) => {
            toast.success('Engagement enregistré.');
            navigate({
              to: '/engagements/$engagementId',
              params: { engagementId: engagement.id },
            });
          },
        },
      );
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Espace contributeur
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Nouvel engagement</h1>
        <p className="text-sm text-muted-foreground">
          Enregistrez une promesse publique et reliez-la, si pertinent, à des délibérations et
          indicateurs.
        </p>
      </div>

      <form
        id="engagement-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="title">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Titre</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="content">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Contenu</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={8}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <Field>
            <FieldLabel>Délibérations liées (optionnel)</FieldLabel>
            <DeliberationPicker selected={selectedDelibs} onToggle={toggleDelib} />
          </Field>

          <Field>
            <FieldLabel>Indicateurs liés (optionnel)</FieldLabel>
            <ObservationPicker selected={selectedObs} onToggle={toggleObs} />
          </Field>
        </FieldGroup>

        <Button type="submit" className="mt-6 w-full" disabled={create.isPending}>
          {create.isPending ? 'Enregistrement…' : "Enregistrer l'engagement"}
        </Button>
      </form>
    </div>
  );
}
