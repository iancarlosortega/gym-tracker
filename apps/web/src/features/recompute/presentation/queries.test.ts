import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { statisticsKeys } from '../../statistics/presentation/queries.ts'
import { workoutsKeys } from '../../workouts/presentation/queries.ts'
import { invalidateAfterRecompute } from './queries.ts'

describe('invalidateAfterRecompute', () => {
  it('marks every statistic stale, because a recompute rewrites historic loads', async () => {
    const client = new QueryClient()
    client.setQueryData(statisticsKeys.week('2026-09-28T00:00:00.000Z'), {})
    client.setQueryData(statisticsKeys.progression('e-1', 'a', 'b'), {})
    client.setQueryData(workoutsKeys.exercises(), [])

    await invalidateAfterRecompute(client)

    const state = (key: readonly unknown[]) => client.getQueryState(key)?.isInvalidated
    expect(state(statisticsKeys.week('2026-09-28T00:00:00.000Z'))).toBe(true)
    expect(state(statisticsKeys.progression('e-1', 'a', 'b'))).toBe(true)
    expect(state(workoutsKeys.exercises())).toBe(false)
  })
})
