import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { Button } from "@/shadcn/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/shadcn/components/ui/field";
import { Input } from "@/shadcn/components/ui/input";
import { useStartRegistration } from "../api";
import { requestRegistrationSchema } from "../model";

export function StartRegistrationPage() {
	const start = useStartRegistration();

	const form = useForm({
		defaultValues: { email: "" },
		validators: { onSubmit: requestRegistrationSchema },
		onSubmit: async ({ value, formApi }) => {
			start.mutate(value, {
				onSuccess: () => {
					toast.success(`Invitation envoyée à ${value.email}.`);
					formApi.reset();
				},
			});
		},
	});

	return (
		<div className="mx-auto max-w-sm space-y-8">
			<div className="space-y-2">
				<p className="text-xs uppercase tracking-wider text-muted-foreground">
					Administration
				</p>
				<h1 className="text-2xl font-semibold tracking-tight">
					Inviter un contributeur
				</h1>
				<p className="text-sm text-muted-foreground">
					Un lien d'inscription sera envoyé à cette adresse. La personne
					choisira elle-même son mot de passe.
				</p>
			</div>

			<form
				id="start-registration-form"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<FieldGroup>
					<form.Field name="email">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>E-mail</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										autoComplete="off"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={isInvalid}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</FieldGroup>
				<Button type="submit" className="mt-6 w-full" disabled={start.isPending}>
					{start.isPending ? "Envoi…" : "Envoyer l'invitation"}
				</Button>
			</form>
		</div>
	);
}
