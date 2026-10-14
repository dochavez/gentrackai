import useSWR from 'swr';

import type { Generator } from '@/features/generators/types';
import { GENERATORS_KEY } from '@/services/api/generators';

/** The authenticated user's generators (SWR-cached via the default axios fetcher). */
export function useGenerators() {
  const { data, error, isLoading, mutate } = useSWR<{ generators: Generator[] }>(GENERATORS_KEY);
  return {
    generators: data?.generators ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}

/** A single generator (for the detail screen). */
export function useGenerator(id: string | undefined) {
  const { data, error, isLoading } = useSWR<{ generator: Generator }>(
    id ? `${GENERATORS_KEY}/${id}` : null
  );
  return {
    generator: data?.generator,
    isLoading,
    error,
  };
}
