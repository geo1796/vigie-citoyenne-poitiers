// features/auth/queries.ts

import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { toast } from 'sonner';
import { api } from '@/api';
import { type AuthedUser, authedUserSchema, type LoginInput } from './model';

export const sessionKey = ['session'] as const;

const fetchSession = async (): Promise<AuthedUser | null> => {
  try {
    const raw = await api.get('auth/me').json();
    return authedUserSchema.parse(raw);
  } catch (err) {
    if (err instanceof HTTPError && err.response.status === 401) return null;
    throw err;
  }
};

export const sessionQueryOptions = queryOptions({
  queryKey: sessionKey,
  queryFn: fetchSession,
  retry: false,
  staleTime: 5 * 60 * 1000,
});

export const useSession = () => useQuery(sessionQueryOptions);

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const raw = await api.post('auth/login', { json: input }).json();
      return authedUserSchema.parse(raw);
    },
    onSuccess: (user) => qc.setQueryData(sessionKey, user),
    onError: (err) => {
      const message =
        err instanceof HTTPError && err.response.status === 401
          ? 'E-mail ou mot de passe incorrect.'
          : 'Une erreur est survenue. Réessayez dans un instant.';
      toast.error(message);
    },
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api
        .post('auth/logout')
        .json()
        .catch(() => {}),
    onSuccess: () => qc.setQueryData(sessionKey, null),
  });
};

export const useStartPasswordReset = () =>
  useMutation({
    mutationFn: (input: { email: string }) =>
      api.post('auth/start-password-reset', { json: input }),
  });

export const useCompletePasswordReset = () =>
  useMutation({
    mutationFn: (input: { token: string; newPassword: string }) =>
      api.post('auth/complete-password-reset', { json: input }),
    onError: (err) => {
      const message =
        err instanceof HTTPError && err.response.status === 401
          ? 'Le lien de réinitialisation a expiré.'
          : 'Une erreur est survenue.';
      toast.error(message);
    },
  });

export const useStartRegistration = () =>
  useMutation({
    mutationFn: (input: { email: string }) => api.post('auth/start-registration', { json: input }),
    onError: (err) => {
      // L'admin est un appelant de confiance : on peut lui dire que l'email
      // existe déjà (pas un risque d'énumération comme pour le reset public).
      const message =
        err instanceof HTTPError && err.response.status === 409
          ? 'Un compte existe déjà pour cette adresse.'
          : 'Une erreur est survenue. Réessayez dans un instant.';
      toast.error(message);
    },
  });

export const useCompleteRegistration = () =>
  useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      api.post('auth/complete-registration', { json: input }),
    onError: (err) => {
      const message =
        err instanceof HTTPError && err.response.status === 401
          ? "Le lien d'invitation a expiré."
          : 'Une erreur est survenue.';
      toast.error(message);
    },
  });
