import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router';
import { CompletePasswordResetPage } from '@/features/auth/components/CompletePasswordResetPage';
import { StartPasswordResetPage } from '@/features/auth/components/StartPasswordResetPage';

export const Route = createFileRoute('/password-reset')({
  component: PasswordResetRoute,
});

function PasswordResetRoute() {
  const hash = useLocation({ select: (l) => l.hash });
  const navigate = useNavigate();
  const token = new URLSearchParams(hash).get('token') ?? undefined;

  if (token) {
    return <CompletePasswordResetPage token={token} onSuccess={() => navigate({ to: '/login' })} />;
  }
  return <StartPasswordResetPage />;
}
