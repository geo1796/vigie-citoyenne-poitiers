import { sessionQueryOptions } from "@/features/auth/api";
import { ContributeurPage } from "@/features/contributeur/components/ContributeurPage";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/espace-contributeur/")({
	beforeLoad: async ({ context, location }) => {
		const session =
			await context.queryClient.ensureQueryData(sessionQueryOptions);
		if (!session) {
			throw redirect({ to: "/login", search: { redirect: location.pathname } });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	return <ContributeurPage onLoggedOut={() => navigate({ to: "/" })} />;
}
