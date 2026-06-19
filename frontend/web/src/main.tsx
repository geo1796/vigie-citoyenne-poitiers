import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { HTTPError } from "ky";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { queryClient } from "./queryClient";
import { routeTree } from "./routeTree.gen";
import { TooltipProvider } from "./shadcn/components/ui/tooltip";

const router = createRouter({
	routeTree,
	context: { queryClient },
	defaultErrorComponent: ({ error }) => (
		<div className="max-w-3xl mx-auto py-12 text-center">
			<p className="text-muted-foreground text-sm">
				{error instanceof HTTPError && error.response.status === 404
					? "Ressource introuvable."
					: "Une erreur est survenue."}
			</p>
		</div>
	),
});

// Déclaration de types pour la type-safety globale du router
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<TooltipProvider>
				<RouterProvider router={router} />
			</TooltipProvider>
		</QueryClientProvider>
	);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
