import type { QueryClient, QueryKey, UseMutationOptions } from '@tanstack/react-query'

/** One cached read and how a change rewrites it before the server agrees. */
export interface CachePatch {
  readonly queryKey: QueryKey
  readonly update: (old: unknown) => unknown
}

/** A patch for a read that is only rewritten when it has been loaded. */
export const patch = <T>(queryKey: QueryKey, update: (old: T) => T): CachePatch => ({
  queryKey,
  update: (old) => (old === undefined ? old : update(old as T)),
})

export interface OptimisticMutationOptions<TVariables, TResult> {
  /** Every call of this mutation shares it; it is how a call knows it is the last one pending. */
  readonly mutationKey: QueryKey
  /** Calls in the same scope reach the server one after another, in the order they were made. */
  readonly scope?: string | undefined
  readonly mutationFn: (variables: TVariables) => Promise<TResult>
  readonly patches: (variables: TVariables) => readonly CachePatch[]
  readonly invalidates: readonly QueryKey[]
}

type Snapshots = readonly (readonly [QueryKey, unknown])[]

/**
 * A change shown before the server answers.
 *
 * Each patched read is cancelled, so a refetch already in flight cannot paint
 * over it, then snapshotted and rewritten. While several calls are pending the
 * screen keeps the latest optimistic state: a failure only restores its
 * snapshot when it is the last call left, because an earlier snapshot would
 * erase the edits made after it. The last call to settle refetches, and stays
 * pending until that lands, so nothing flickers back to an older state.
 */
export const optimisticMutation = <TVariables, TResult>({
  mutationKey,
  scope,
  mutationFn,
  patches,
  invalidates,
}: OptimisticMutationOptions<TVariables, TResult>): UseMutationOptions<
  TResult,
  Error,
  TVariables,
  Snapshots
> => {
  const isLastPending = (client: QueryClient) => client.isMutating({ mutationKey }) === 1

  return {
    mutationKey,
    ...(scope === undefined ? {} : { scope: { id: scope } }),
    mutationFn,
    onMutate: async (variables, { client }) => {
      const changes = patches(variables)
      await Promise.all(changes.map(({ queryKey }) => client.cancelQueries({ queryKey })))

      return changes.map(({ queryKey, update }) => {
        const previous = client.getQueryData(queryKey)
        client.setQueryData(queryKey, update(previous))
        return [queryKey, previous] as const
      })
    },
    onError: (_error, _variables, snapshots, { client }) => {
      if (snapshots === undefined || !isLastPending(client)) {
        return
      }
      for (const [queryKey, previous] of [...snapshots].reverse()) {
        client.setQueryData(queryKey, previous)
      }
    },
    onSettled: (_data, _error, _variables, _snapshots, { client }) => {
      if (!isLastPending(client)) {
        return
      }
      return Promise.all(invalidates.map((queryKey) => client.invalidateQueries({ queryKey })))
    },
  }
}
