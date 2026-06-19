import { useSession, useStartPasswordReset } from "@/features/auth/api";
import { startPasswordResetSchema } from "@/features/auth/model";
import { Button } from "@/shadcn/components/ui/button";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/shadcn/components/ui/field";
import { Input } from "@/shadcn/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

export function StartPasswordResetPage() {
	const { data: session } = useSession();
	const form = useForm({
		defaultValues: { email: session?.email ?? "" },
		validators: { onSubmit: startPasswordResetSchema },
		onSubmit: async ({ value }) => {
			start.mutate(value, {
				onSuccess: () =>
					toast.success("Un lien de réinitialisation vous a été envoyé."),
				onError: (_) =>
					toast.error("Une erreur est survenue."),
			});
		},
	});
	const start = useStartPasswordReset();

	return (
		<div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
			<div className="space-y-2">
				<p className="text-xs uppercase tracking-wider text-muted-foreground">
					Mot de passe oublié
				</p>
				<h1 className="text-2xl font-semibold tracking-tight">
					Réinitialisation
				</h1>
				<p className="text-sm text-muted-foreground">
					Indiquez votre adresse e-mail pour recevoir un lien de
					réinitialisation.
				</p>
			</div>

			<form
				id="start-password-reset-form"
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
									<FieldLabel htmlFor={field.name}>Email</FieldLabel>
									<Input
										type="email"
										autoComplete="email"
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
				</FieldGroup>

				<Button type="submit" className="w-full mt-6" disabled={start.isPending}>
					{start.isPending ? "Envoi…" : "Envoyer le lien"}
				</Button>
			</form>
		</div>
	);
}
