import ky from "ky";

const isTest = Boolean(
	import.meta.env?.MODE === "test" || import.meta?.env?.VITEST,
);

// Single-flight : N requêtes qui prennent un 401 en parallèle
// ne déclenchent qu'UN seul /auth/refresh.
let refreshPromise: Promise<void> | null = null;

const refreshAuth = (): Promise<void> => {
	refreshPromise ??= api
		.post("auth/refresh")
		.json()
		.then(() => undefined)
		.finally(() => {
			refreshPromise = null;
		});
	return refreshPromise;
};

export const api = ky.create({
	prefix: "/api/v1",
	// prefix: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api",
	credentials: "include",
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
	retry: 0, // let tanstack query handle retries
	hooks: {
		afterResponse: isTest
			? []
			: [
					async (state) => {
						const request = state.request;
						const response = state.response;
						if (response.status !== 401) return;

						// Ne jamais tenter de refresh sur les endpoints qui
						// produisent légitimement un 401 : login (mauvais
						// identifiants) et refresh lui-même (anti-récursion).
						const { pathname } = new URL(request.url);
						if (
							pathname.endsWith("/auth/login") ||
							pathname.endsWith("/auth/refresh")
						) {
							return;
						}

						try {
							await refreshAuth();
						} catch {
							return response; // refresh échoué → on rend le 401 d'origine
						}
						return api(request); // refresh OK → on rejoue la requête
					},
				],
	},
});
