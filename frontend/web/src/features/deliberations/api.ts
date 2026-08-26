import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { api } from '@/api';
import {
  type FindDeliberationResult,
  findDeliberationResultSchema,
  type ListDeliberationsParams,
  type ListDeliberationsResult,
  listDeliberationsParamsSchema,
  listDeliberationsResultSchema,
} from './model';

// Fonction de fetch — adapte selon ta config (baseURL, etc.)
async function fetchDeliberation(id: string): Promise<FindDeliberationResult> {
  const response = await api.get(`deliberations/${id}`);
  if (!response.ok) {
    throw new Error(`Délibération introuvable (${response.status})`);
  }
  const data = await response.json();
  // Hydratation des dates si ton API renvoie des strings ISO
  return findDeliberationResultSchema.parse(data);
}

async function fetchDeliberations(
  params: ListDeliberationsParams,
): Promise<ListDeliberationsResult> {
  const qs = buildQueryString(params);
  const res = await api.get(`deliberations?${qs}`).json();
  return listDeliberationsResultSchema.parse(res);
}

export const deliberationsQueries = {
  list: (rawParams: Partial<ListDeliberationsParams>) => {
    const params = listDeliberationsParamsSchema.parse(rawParams);
    return queryOptions({
      queryKey: ['deliberations', 'list', params],
      queryFn: () => fetchDeliberations(params),
      staleTime: 5 * 60 * 1000, // 1h
    });
  },
  infiniteList: (rawParams: Partial<Omit<ListDeliberationsParams, 'offset'>>) => {
    const params = listDeliberationsParamsSchema.parse(rawParams);

    return infiniteQueryOptions({
      queryKey: ['deliberations', 'infiniteList', params],
      queryFn: ({ pageParam }) => fetchDeliberations({ ...params, offset: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextOffset : undefined),
      staleTime: 60 * 60 * 1000, // 1h
    });
  },
  detail: (id: string) =>
    queryOptions({
      queryKey: ['deliberations', 'detail', id],
      queryFn: () => fetchDeliberation(id),
      staleTime: 60 * 60 * 1000, // 1h
    }),
};

function buildQueryString(params: ListDeliberationsParams): string {
  const qs = new URLSearchParams();

  if (params.search) {
    qs.set('search', params.search);
  }

  if (params.collectivites) {
    for (const c of params.collectivites) {
      qs.append('collectivites', c);
    }
  }
  if (params.instances) {
    for (const i of params.instances) {
      qs.append('instances', i);
    }
  }

  if (params.dateFrom) {
    qs.set('dateFrom', formatDateOnly(params.dateFrom));
  }
  if (params.dateTo) {
    qs.set('dateTo', formatDateOnly(params.dateTo));
  }

  qs.set('limit', String(params.limit));
  qs.set('offset', String(params.offset));
  qs.set('sortAsc', String(params.sortAsc));

  return qs.toString();
}

function formatDateOnly(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
