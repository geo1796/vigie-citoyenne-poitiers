import { queryOptions } from '@tanstack/react-query';
import { api } from '@/api';
import {
  type IndicateurKey,
  type ListIndicateursResult,
  type ListObservationsResult,
  listIndicateursResultSchema,
  listObservationsResultSchema,
} from './model';

async function fetchIndicateurs(): Promise<ListIndicateursResult> {
  const res = await api.get('indicateurs').json();
  return listIndicateursResultSchema.parse(res);
}

async function fetchObservations(key: IndicateurKey): Promise<ListObservationsResult> {
  const res = await api.get(`indicateurs/${key}/observations`).json();
  return listObservationsResultSchema.parse(res);
}

export const indicateursQueries = {
  list: () =>
    queryOptions({
      queryKey: ['indicateurs', 'list'],
      queryFn: fetchIndicateurs,
      staleTime: 60 * 60 * 1000, // 1h
    }),
  observations: (key: IndicateurKey) =>
    queryOptions({
      queryKey: ['indicateurs', 'observations', key],
      queryFn: () => fetchObservations(key),
      staleTime: 60 * 60 * 1000, // 1h
    }),
};
