import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { lastSetsKeys, prefetchLastSets } from './last-sets.queries.ts'

describe('prefetchLastSets', () => {
  it('reads last time for every planned exercise once, while online', async () => {
    const client = new QueryClient()
    const read = vi.fn(async () => null)

    await prefetchLastSets(client, ['e-1', 'e-2', 'e-1'], 's-open', { online: true, read })

    expect(read).toHaveBeenCalledTimes(2)
    expect(read).toHaveBeenCalledWith('e-2', 's-open')
    expect(client.getQueryState(lastSetsKeys.of('e-1', 's-open'))?.status).toBe('success')
  })

  it('reads nothing offline, so nothing waits on a network that is not there', async () => {
    const read = vi.fn(async () => null)

    await prefetchLastSets(new QueryClient(), ['e-1'], 's-open', { online: false, read })

    expect(read).not.toHaveBeenCalled()
  })
})
