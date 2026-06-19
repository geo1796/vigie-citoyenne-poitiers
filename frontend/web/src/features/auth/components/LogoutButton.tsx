import { Button } from "@/shadcn/components/ui/button";
import { useLogout } from "@/features/auth/api";

type LogoutButtonProps = {
	onLoggedOut?: () => void;
};

export function LogoutButton({ onLoggedOut }: LogoutButtonProps) {
	const logout = useLogout();
	return (
		<Button
			variant="outline"
			disabled={logout.isPending}
			onClick={() => logout.mutate(undefined, { onSuccess: onLoggedOut })}
		>
			{logout.isPending ? "Déconnexion…" : "Se déconnecter"}
		</Button>
	);
}