import { type QueryClient, queryOptions, useQuery } from '@tanstack/react-query'
import { getLastSets } from '../infrastructure/last-sets.api'

export const lastSetsKeys = {
  all: ['last-sets'] as const,
  of: (exerciseId: string, sessionId: string | null) =>
    [...lastSetsKeys.all, exerciseId, sessionId] as const,
}

/** Last time does not change during a workout, so once read it stays read. */
const lastSetsQuery = (
  exerciseId: string,
  sessionId: string | null,
  read: typeof getLastSets = getLastSets,
) =>
  queryOptions({
    queryKey: lastSetsKeys.of(exerciseId, sessionId),
    queryFn: () => read(exerciseId, sessionId),
    staleTime: Number.POSITIVE_INFINITY,
  })

export const useLastSets = (exerciseId: string, sessionId: string | null) =>
  useQuery(lastSetsQuery(exerciseId, sessionId))

/**
 * Read last time for every exercise of the plan while there is a connection,
 * so the card still has something to show once the gym's basement takes it away.
 */
export const prefetchLastSets = async (
  client: QueryClient,
  exerciseIds: readonly string[],
  sessionId: string | null,
  { online = globalThis.navigator?.onLine ?? true, read = getLastSets } = {},
): Promise<void> => {
  if (!online) return
  await Promise.all(
    [...new Set(exerciseIds)].map((exerciseId) =>
      client.prefetchQuery(lastSetsQuery(exerciseId, sessionId, read)),
    ),
  )
}
