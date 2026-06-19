import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

queryClient.removeQueries({
	predicate: (query) => {
		const key = query.queryKey[0];
		return (
			key === "deliberations" ||
			key === "indicateurs" ||
			key === "engagements" ||
			key === "nominations"
		);
	},
});
