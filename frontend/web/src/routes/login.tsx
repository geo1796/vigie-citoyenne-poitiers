// routes/login.tsx

import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { sessionQueryOptions } from '@/features/auth/api';
import { LoginPage } from '@/features/auth/components/LoginPage';

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
    if (session) throw redirect({ to: search.redirect ?? '/' });
  },
  component: LoginRoute,
});

function LoginRoute() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  return <LoginPage onSuccess={() => navigate({ to: redirectTo ?? '/' })} />;
}
