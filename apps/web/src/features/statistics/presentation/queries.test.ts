import { describe, expect, it } from 'vitest'
import { exerciseProgressionQuery, statisticsKeys, weekComparisonQuery } from './queries.ts'

describe('statistics queries', () => {
  it('key equal instants alike, so two Date objects share one cache entry', () => {
    const a = weekComparisonQuery(new Date('2026-09-28T00:00:00.000Z'))
    const b = weekComparisonQuery(new Date('2026-09-28T00:00:00.000Z'))

    expect(a.queryKey).toEqual(b.queryKey)
  })

  it('key every input of the progression, so a different range is a different read', () => {
    const from = new Date('2026-07-01T00:00:00.000Z')
    const to = new Date('2026-10-01T00:00:00.000Z')
    const later = new Date('2026-10-02T00:00:00.000Z')

    expect(exerciseProgressionQuery('e-1', from, to).queryKey).not.toEqual(
      exerciseProgressionQuery('e-2', from, to).queryKey,
    )
    expect(exerciseProgressionQuery('e-1', from, to).queryKey).not.toEqual(
      exerciseProgressionQuery('e-1', from, later).queryKey,
    )
  })

  it('nest every key under one root, so a recompute can invalidate them all', () => {
    const week = weekComparisonQuery(new Date()).queryKey
    const progression = exerciseProgressionQuery('e-1', new Date(), new Date()).queryKey

    expect(week[0]).toBe(statisticsKeys.all[0])
    expect(progression[0]).toBe(statisticsKeys.all[0])
  })
})
