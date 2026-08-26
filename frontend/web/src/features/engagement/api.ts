import {
  infiniteQueryOptions,
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { toast } from 'sonner';
import { api } from '@/api';
import {
  type CreateEngagementInput,
  type CreateEngagementUpdateInput,
  type Engagement,
  type EngagementUpdate,
  engagementSchema,
  engagementUpdateSchema,
  type FindEngagementResult,
  findEngagementResultSchema,
  type ListEngagementsParams,
  type ListEngagementsResult,
  listEngagementsParamsSchema,
  listEngagementsResultSchema,
} from './model';

async function fetchEngagement(id: string): Promise<FindEngagementResult> {
  const response = await api.get(`engagements/${id}`);
  if (!response.ok) {
    throw new Error(`Engagement introuvable (${response.status})`);
  }
  return findEngagementResultSchema.parse(await response.json());
}

async function fetchEngagements(params: ListEngagementsParams): Promise<ListEngagementsResult> {
  const qs = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  const res = await api.get(`engagements?${qs.toString()}`).json();
  return listEngagementsResultSchema.parse(res);
}

export const engagementsQueries = {
  infiniteList: (rawParams: Partial<Omit<ListEngagementsParams, 'offset'>> = {}) => {
    const params = listEngagementsParamsSchema.parse(rawParams);
    return infiniteQueryOptions({
      queryKey: ['engagements', 'infiniteList', params],
      queryFn: ({ pageParam }) => fetchEngagements({ ...params, offset: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
      staleTime: 5 * 60 * 1000,
    });
  },
  detail: (id: string) =>
    queryOptions({
      queryKey: ['engagements', 'detail', id],
      queryFn: () => fetchEngagement(id),
      staleTime: 5 * 60 * 1000,
    }),
};

export const useCreateEngagement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEngagementInput): Promise<Engagement> => {
      const raw = await api.post('engagements', { json: input }).json();
      return engagementSchema.parse(raw);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['engagements'] });
    },
    onError: () => {
      toast.error('Une erreur est survenue. Réessayez dans un instant.');
    },
  });
};

export const useCreateEngagementUpdate = (engagementId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEngagementUpdateInput): Promise<EngagementUpdate> => {
      const raw = await api.post(`engagements/${engagementId}/updates`, { json: input }).json();
      return engagementUpdateSchema.parse(raw);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['engagements'] });
    },
    onError: (err) => {
      const message =
        err instanceof HTTPError && err.response.status === 400
          ? 'Vérifiez les champs : la délibération liée ou le lien externe est invalide.'
          : 'Une erreur est survenue. Réessayez dans un instant.';
      toast.error(message);
    },
  });
};

export const useUpdateEngagementUpdate = (engagementId: string, updateId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEngagementUpdateInput): Promise<EngagementUpdate> => {
      const raw = await api
        .put(`engagements/${engagementId}/updates/${updateId}`, { json: input })
        .json();
      return engagementUpdateSchema.parse(raw);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['engagements'] });
    },
    onError: (err) => {
      const message =
        err instanceof HTTPError && err.response.status === 400
          ? 'Vérifiez les champs : la délibération liée ou le lien externe est invalide.'
          : 'Une erreur est survenue. Réessayez dans un instant.';
      toast.error(message);
    },
  });
};
