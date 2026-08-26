// routes/inscription.tsx  (public)
import { createFileRoute, useLocation, useNavigate } from '@tanstack/react-router';
import { CompleteRegistrationPage } from '@/features/auth/components/CompleteRegistrationPage';

export const Route = createFileRoute('/inscription')({
  component: InscriptionRoute,
});

function InscriptionRoute() {
  const hash = useLocation({ select: (l) => l.hash });
  const navigate = useNavigate();
  const token = new URLSearchParams(hash).get('token') ?? undefined;

  if (!token) {
    return (
      <div className="mx-auto max-w-sm space-y-3 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Lien invalide</h1>
        <p className="text-sm text-muted-foreground">
          Ce lien d'inscription est incomplet. Demandez une nouvelle invitation.
        </p>
      </div>
    );
  }

  return <CompleteRegistrationPage token={token} onSuccess={() => navigate({ to: '/login' })} />;
}
