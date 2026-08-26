import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { deliberationsQueries } from '@/features/deliberations/api';
import { type Deliberation, instanceLabels } from '@/features/deliberations/model';
import { Route } from '@/routes/espace-contributeur/engagements/$engagementId/updates/nouveau';
import { Button } from '@/shadcn/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shadcn/components/ui/field';
import { Input } from '@/shadcn/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select';
import { Textarea } from '@/shadcn/components/ui/textarea';
import { useCreateEngagementUpdate } from '../api';
import { type EngagementStatus, engagementStatusLabels, engagementStatusSchema } from '../model';

const DEBOUNCE_MS = 300;
const STATUS_OPTIONS = engagementStatusSchema.options;

const updateFormSchema = z.object({
  status: engagementStatusSchema,
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de l'événement requise."),
  content: z.string().trim().min(1, 'La note est requise.'),
  externalSource: z.union([z.literal(''), z.string().trim().url('Lien invalide (URL attendue).')]),
});

// Date du jour au format « YYYY-MM-DD » (fuseau local), pour pré-remplir le champ.
function todayIsoDate(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function DeliberationPicker({
  selected,
  onSelect,
  onClear,
}: {
  selected: Deliberation | null;
  onSelect: (d: Deliberation) => void;
  onClear: () => void;
}) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(input.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [input]);

  const { data, isFetching } = useQuery({
    ...deliberationsQueries.list({ search: search || undefined, limit: 10 }),
    enabled: search.length > 0 && selected === null,
  });

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-1.5">
        <span className="truncate text-sm">{selected.delibObjet}</span>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
          aria-label="Retirer"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  const results = data?.items ?? [];

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
              onClick={() => {
                onSelect(d);
                setInput('');
                setSearch('');
              }}
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
    </div>
  );
}

export function EngagementUpdateFormPage() {
  const { engagementId } = Route.useParams();
  const navigate = useNavigate();
  const create = useCreateEngagementUpdate(engagementId);

  const [selectedDelib, setSelectedDelib] = useState<Deliberation | null>(null);

  const form = useForm({
    defaultValues: {
      status: 'en_cours' as EngagementStatus,
      eventDate: todayIsoDate(),
      content: '',
      externalSource: '',
    },
    validators: {
      onSubmit: updateFormSchema,
    },
    onSubmit: async ({ value }) => {
      create.mutate(
        {
          status: value.status,
          eventDate: value.eventDate,
          content: value.content,
          deliberationId: selectedDelib?.id ?? null,
          externalSource: value.externalSource ? value.externalSource : null,
        },
        {
          onSuccess: () => {
            toast.success('Mise à jour enregistrée.');
            navigate({
              to: '/engagements/$engagementId',
              params: { engagementId },
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
        <h1 className="text-2xl font-semibold tracking-tight">Nouvelle mise à jour</h1>
        <p className="text-sm text-muted-foreground">
          Documentez l'avancement de l'engagement : un statut, une note, et éventuellement une
          délibération ou un lien externe.
        </p>
      </div>

      <form
        id="engagement-update-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="status">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Statut</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as EngagementStatus)}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {engagementStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <form.Field name="eventDate">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Date de l'événement</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="date"
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
                  <FieldLabel htmlFor={field.name}>Note</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={6}
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
            <FieldLabel>Délibération liée (optionnel)</FieldLabel>
            <DeliberationPicker
              selected={selectedDelib}
              onSelect={setSelectedDelib}
              onClear={() => setSelectedDelib(null)}
            />
          </Field>

          <form.Field name="externalSource">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Source externe (optionnel)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="url"
                    placeholder="https://…"
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
        </FieldGroup>

        <Button type="submit" className="mt-6 w-full" disabled={create.isPending}>
          {create.isPending ? 'Enregistrement…' : 'Enregistrer la mise à jour'}
        </Button>
      </form>
    </div>
  );
}
