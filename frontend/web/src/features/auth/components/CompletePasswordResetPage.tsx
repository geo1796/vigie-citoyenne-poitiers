import { useCompletePasswordReset } from "@/features/auth/api";
import { completePasswordResetSchema } from "@/features/auth/model";
import { Button } from "@/shadcn/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/shadcn/components/ui/field";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { PasswordInput } from "./PasswordInput";

type Props = {
	token: string;
	onSuccess: () => void;
};

export function CompletePasswordResetPage({ token, onSuccess }: Props) {
	const complete = useCompletePasswordReset();
	const form = useForm({
		defaultValues: {
			newPassword: "",
			confirmPassword: "",
		},
		validators: { onSubmit: completePasswordResetSchema },
		onSubmit: async ({ value }) => {
			complete.mutate(
				{ token: token, newPassword: value.newPassword },
				{ onSuccess },
			);
		},
	});

	const [showPassword, setShowPassword] = useState(false);
	const togglePasswordVisibility = () => setShowPassword((v) => !v);

	return (
		<div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
			<div className="mb-6 space-y-2">
				<p className="text-xs uppercase tracking-wider text-muted-foreground">
					Nouveau mot de passe
				</p>
				<h1 className="text-2xl font-semibold tracking-tight">
					Choisissez un mot de passe
				</h1>
			</div>

			<form
				id="complete-password-reset-form"
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit();
				}}
			>
				<FieldGroup>
					<form.Field name="newPassword">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Mot de passe</FieldLabel>
									<PasswordInput
										autoComplete="new-password"
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										visible={showPassword}
										onToggleVisibility={togglePasswordVisibility}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
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
										autoComplete="confirm-password"
										id={field.name}
										name={field.name}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										visible={showPassword}
										onToggleVisibility={togglePasswordVisibility}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>
				</FieldGroup>

				<Button
					type="submit"
					className="w-full mt-6"
					disabled={complete.isPending}
				>
					{complete.isPending ? "Validation…" : "Réinitialiser le mot de passe"}
				</Button>
			</form>
		</div>
	);
}
