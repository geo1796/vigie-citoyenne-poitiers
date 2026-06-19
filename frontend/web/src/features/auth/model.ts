import { z } from "zod";

export const roleSchema = z.enum(["contributeur", "admin"]);
export type Role = z.infer<typeof roleSchema>;
export const roleLabels: Record<Role, string> = {
	contributeur: "Contributeur",
	admin: "Administrateur",
};

export const authedUserSchema = z.object({
	email: z.string(),
	roles: z.array(roleSchema),
});

export type AuthedUser = z.infer<typeof authedUserSchema>;

// Validation de ce que l'utilisateur saisit, AVANT envoi.
// Pas de règle de robustesse ici : on vérifie juste que les champs sont remplis.
export const loginInputSchema = z.object({
	email: z.email("Adresse e-mail invalide"),
	password: z.string().min(1, "Mot de passe requis"),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

const PASSWORD_MAX_BYTES = 72;

export const newPasswordSchema = z
	.string()
	.min(8, "Au moins 8 caractères")
	.regex(/[a-z]/, "Au moins une minuscule")
	.regex(/[A-Z]/, "Au moins une majuscule")
	.regex(/[0-9]/, "Au moins un chiffre")
	.regex(/[^A-Za-z0-9]/, "Au moins un caractère spécial")
	.refine(
		(v) => new TextEncoder().encode(v).length <= PASSWORD_MAX_BYTES,
		"Mot de passe trop long (72 octets maximum)",
	);

export const startPasswordResetSchema = z.object({
	email: z.email("Adresse e-mail invalide"),
});
export type StartPasswordResetInput = z.infer<typeof startPasswordResetSchema>;

export const completePasswordResetSchema = z
	.object({
		newPassword: newPasswordSchema,
		confirmPassword: z.string(),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: "Les mots de passe ne correspondent pas",
		path: ["confirmPassword"],
	});
export type CompletePasswordResetInput = z.infer<
	typeof completePasswordResetSchema
>;

export const requestRegistrationSchema = z.object({
	email: z.string().email("Adresse e-mail invalide"),
});

export const completeRegistrationSchema = z
	.object({
		password: newPasswordSchema,
		confirmPassword: z.string(),
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: "Les mots de passe ne correspondent pas",
		path: ["confirmPassword"],
	});
