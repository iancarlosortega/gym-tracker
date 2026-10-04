import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'

export interface QueryStateProps<TData> {
  readonly query: UseQueryResult<TData>
  /** While the request is genuinely in flight. */
  readonly pending: ReactNode
  /** When the read failed; each screen says what it could not show. */
  readonly failed: ReactNode
  readonly children: (data: TData) => ReactNode
}

/** Pending with nothing in flight: the query client is waiting for a network. */
export const isWaitingForNetwork = (query: Pick<UseQueryResult, 'isPending' | 'fetchStatus'>) =>
  query.isPending && query.fetchStatus === 'paused'

export const OfflineNotice = () => (
  <p role="status" className="text-muted-foreground">
    You're offline. This shows up once you're back online.
  </p>
)

/**
 * The four states a screen's read can be in, rendered the same way everywhere.
 *
 * Offline is its own state because the query client pauses rather than fails
 * without a network: the query stays pending with nothing in flight, and a
 * screen that only checked "pending" would show its loader for as long as the
 * phone stays in the basement.
 */
export const QueryState = <TData,>({
  query,
  pending,
  failed,
  children,
}: QueryStateProps<TData>) => {
  if (isWaitingForNetwork(query)) {
    return <OfflineNotice />
  }

  if (query.isPending) {
    return <>{pending}</>
  }

  if (query.isError) {
    return <>{failed}</>
  }

  return <>{children(query.data)}</>
}
