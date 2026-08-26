import { createFileRoute } from '@tanstack/react-router';
import { StartRegistrationPage } from '@/features/auth/components/StartRegistrationPage';

export const Route = createFileRoute('/admin/inviter-contributeur')({
  component: StartRegistrationPage,
});
