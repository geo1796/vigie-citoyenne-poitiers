import { useForm } from '@tanstack/react-form';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CalendarIcon, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { fr } from 'react-day-picker/locale';
import { toast } from 'sonner';
import { z } from 'zod';
import { deliberationsQueries } from '@/features/deliberations/api';
import { type Deliberation, instanceLabels } from '@/features/deliberations/model';
import { Button } from '@/shadcn/components/ui/button';
import { Calendar } from '@/shadcn/components/ui/calendar';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shadcn/components/ui/field';
import { Input } from '@/shadcn/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shadcn/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shadcn/components/ui/select';
import { Textarea } from '@/shadcn/components/ui/textarea';
import { useCreateEngagementUpdate, useUpdateEngagementUpdate } from '../api';
import {
  type EngagementStatus,
  type EngagementUpdate,
  engagementStatusLabels,
  engagementStatusSchema,
} from '../model';

const DEBOUNCE_MS = 300;
const STATUS_OPTIONS = engagementStatusSchema.options;

const updateFormSchema = z.object({
  status: engagementStatusSchema,
  eventDate: z.date(),
  content: z.string().trim().min(1, 'La note est requise.'),
  externalSource: z.union([z.literal(''), z.url('Lien invalide (URL attendue).')]),
});

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

export function EngagementUpdateFormPage({
  engagementId,
  update,
}: {
  engagementId: string;
  update?: EngagementUpdate;
}) {
  const isEdit = update !== undefined;
  const navigate = useNavigate();
  const create = useCreateEngagementUpdate(engagementId);
  const edit = useUpdateEngagementUpdate(engagementId, update?.id ?? '');
  const pending = isEdit ? edit.isPending : create.isPending;

  const [selectedDelib, setSelectedDelib] = useState<Deliberation | null>(
    update?.deliberation ?? null,
  );

  const selectStatutItems = STATUS_OPTIONS.map((status) => ({
    value: status,
    label: engagementStatusLabels[status],
  }));

  const [openDatePicker, setOpenDatePicker] = React.useState(false);

  const form = useForm({
    defaultValues: {
      status: update?.status ?? ('en_cours' as EngagementStatus),
      eventDate: update?.eventDate ?? new Date(),
      content: update?.content ?? '',
      externalSource: update?.externalSource ?? '',
    },
    validators: {
      onSubmit: updateFormSchema,
    },
    onSubmit: async ({ value }) => {
      const mutation = isEdit ? edit : create;
      mutation.mutate(
        {
          status: value.status,
          eventDate: formatDateOnly(value.eventDate),
          content: value.content,
          deliberationId: selectedDelib?.id ?? null,
          externalSource: value.externalSource ? value.externalSource : null,
        },
        {
          onSuccess: () => {
            toast.success(isEdit ? 'Mise à jour modifiée.' : 'Mise à jour enregistrée.');
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
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? 'Modifier la mise à jour' : 'Nouvelle mise à jour'}
        </h1>
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
                  items={selectStatutItems}
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as EngagementStatus)}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectStatutItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
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
                  <Popover open={openDatePicker} onOpenChange={setOpenDatePicker}>
                    <PopoverTrigger
                      render={
                        <Button
                          id={field.name}
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          aria-invalid={isInvalid}
                          onBlur={field.handleBlur}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />

                          {field.state.value ? (
                            field.state.value.toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                        </Button>
                      }
                    />

                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.state.value}
                        required={true}
                        onSelect={(date: Date) => {
                          field.handleChange(z.date().parse(date));
                          setOpenDatePicker(false);
                        }}
                        disabled={(date: Date) => date > new Date()}
                        locale={fr}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
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

        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending
            ? 'Enregistrement…'
            : isEdit
              ? 'Enregistrer les modifications'
              : 'Enregistrer la mise à jour'}
        </Button>
      </form>
    </div>
  );
}

function formatDateOnly(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
