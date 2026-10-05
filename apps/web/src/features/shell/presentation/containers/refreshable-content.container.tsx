'use client'

import { useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { offlineWork } from '../../../workouts/presentation/offline-work'
import { PullToRefresh } from '../components/pull-to-refresh'

/**
 * A pull sends whatever the phone still owes the server first, then reads the
 * screen again, so the refreshed view already includes those sets.
 */
export const RefreshableContent = ({ children }: { readonly children: ReactNode }) => {
  const client = useQueryClient()

  return (
    <PullToRefresh
      onRefresh={async () => {
        await offlineWork()
          .sync.execute()
          .catch(() => undefined)
        await client.refetchQueries({ type: 'active' })
      }}
    >
      {children}
    </PullToRefresh>
  )
}
