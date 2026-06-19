import { Button } from "@/shadcn/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/shadcn/components/ui/field";
import { Input } from "@/shadcn/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { useLogin } from "../api";
import { loginInputSchema } from "../model";
import { PasswordInput } from "./PasswordInput";
import { Link } from "@tanstack/react-router";

type Props = {
	onSuccess: () => void;
};

export function LoginPage({ onSuccess }: Props) {
	const login = useLogin();
	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: { onSubmit: loginInputSchema },
		onSubmit: async ({ value }) => {
			login.mutate(value, { onSuccess });
		},
	});

	return (
		<div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4">
			<div className="space-y-2">
				<p className="text-xs uppercase tracking-wider text-muted-foreground">
					Espace contributeur
				</p>
				<h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
			</div>

			<form
				id="login-form"
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
					<form.Field name="password">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Mot de passe</FieldLabel>
									<PasswordInput
										autoComplete="current-password"
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
				<Button
					type="submit"
					className="w-full mt-6"
					disabled={login.isPending}
				>
					{login.isPending ? "Connexion…" : "Se connecter"}
				</Button>
			</form>
			<Link
				to="/password-reset"
				className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline"
			>
				Réinitialiser mon mot de passe
			</Link>
		</div>
	);
}
