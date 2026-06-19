import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Button } from "@/shadcn/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/shadcn/components/ui/field";
import { useCompleteRegistration } from "../api";
import { completeRegistrationSchema } from "../model";
import { PasswordInput } from "./PasswordInput";

type Props = {
	token: string;
	onSuccess: () => void;
};

export function CompleteRegistrationPage({ token, onSuccess }: Props) {
	const complete = useCompleteRegistration();
	const [showPassword, setShowPassword] = useState(false);
	const toggle = () => setShowPassword((v) => !v);

	const form = useForm({
		defaultValues: { password: "", confirmPassword: "" },
		validators: { onSubmit: completeRegistrationSchema },
		onSubmit: async ({ value }) => {
			complete.mutate({ token, password: value.password }, { onSuccess });
		},
	});

	return (
		<div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
			<div className="space-y-2">
				<p className="text-xs uppercase tracking-wider text-muted-foreground">
					Finaliser l'inscription
				</p>
				<h1 className="text-2xl font-semibold tracking-tight">
					Choisissez un mot de passe
				</h1>
			</div>

			<form
				id="complete-registration-form"
				className="mt-8"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<FieldGroup>
					<form.Field name="password">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Mot de passe</FieldLabel>
									<PasswordInput
										id={field.name}
										name={field.name}
										autoComplete="new-password"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={isInvalid}
										visible={showPassword}
										onToggleVisibility={toggle}
									/>
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="confirmPassword">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Confirmation</FieldLabel>
									<PasswordInput
										id={field.name}
										name={field.name}
										autoComplete="new-password"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										aria-invalid={isInvalid}
										visible={showPassword}
										onToggleVisibility={toggle}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</FieldGroup>

				<Button type="submit" className="w-full" disabled={complete.isPending}>
					{complete.isPending ? "Validation…" : "Créer mon compte"}
				</Button>
			</form>
		</div>
	);
}