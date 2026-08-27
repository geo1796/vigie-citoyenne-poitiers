import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { Button } from '@/shadcn/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shadcn/components/ui/field';
import { Input } from '@/shadcn/components/ui/input';
import { useCreateEngagement } from '../api';
import { createEngagementInputSchema } from '../model';

export function EngagementFormPage() {
  const navigate = useNavigate();
  const create = useCreateEngagement();

  const form = useForm({
    defaultValues: { title: '', reference: '' },
    validators: {
      onSubmit: createEngagementInputSchema,
    },
    onSubmit: async ({ value }) => {
      create.mutate(
        { title: value.title, reference: value.reference },
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
          Enregistrez une promesse publique. Vous documenterez ensuite son avancement au fil de
          mises à jour.
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
                  <FieldLabel htmlFor={field.name}>Intitulé de l'engagement</FieldLabel>
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

          <form.Field name="reference">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Source de l'engagement</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Programme électoral, discours, article de presse…"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>

        <Button type="submit" className="mt-6 w-full" disabled={create.isPending}>
          {create.isPending ? 'Enregistrement…' : "Enregistrer l'engagement"}
        </Button>
      </form>
    </div>
  );
}
