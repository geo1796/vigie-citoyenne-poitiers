import { Link } from "@tanstack/react-router";
import { useSession } from "@/features/auth/api";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

type Props = {
	onLoggedOut: () => void;
};

export function ContributeurPage({ onLoggedOut }: Props) {
	const { data: session } = useSession();

	return (
		<div className="mx-auto max-w-3xl space-y-8">
			<div className="space-y-2">
				<p className="text-xs uppercase tracking-wider text-muted-foreground">
					Espace contributeur
				</p>
				<h1 className="text-2xl font-semibold tracking-tight">Mon compte</h1>
				{session && (
					<p className="text-sm text-muted-foreground">
						Connecté en tant que {session.email}
					</p>
				)}
			</div>

			{session?.roles.includes("admin") && (
				<Link
					to="/admin/inviter-contributeur"
					className="inline-block text-sm text-primary underline-offset-4 hover:underline"
				>
					Inviter un contributeur
				</Link>
			)}

			<div className="space-y-4">
				<p className="text-xs uppercase tracking-wider text-muted-foreground">
					Sécurité
				</p>
				<Link
					to="/password-reset"
					className="inline-block text-sm text-primary underline-offset-4 hover:underline"
				>
					Réinitialiser mon mot de passe
				</Link>
			</div>

			<div className="border-t border-border pt-6">
				<LogoutButton onLoggedOut={onLoggedOut} />
			</div>
		</div>
	);
}
