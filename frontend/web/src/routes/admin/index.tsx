import { sessionQueryOptions } from "@/features/auth/api";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
	beforeLoad: async ({ context, location }) => {
		const session =
			await context.queryClient.ensureQueryData(sessionQueryOptions);
		if (!session) {
			throw redirect({ to: "/login", search: { redirect: location.pathname } });
		}
		if (!session.roles.includes("admin")) {
			throw redirect({ to: "/" });
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/admin/"!</div>;
}
