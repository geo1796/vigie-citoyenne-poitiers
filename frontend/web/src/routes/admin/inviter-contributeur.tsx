import { StartRegistrationPage } from "@/features/auth/components/StartRegistrationPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/inviter-contributeur")({
	component: StartRegistrationPage,
});
