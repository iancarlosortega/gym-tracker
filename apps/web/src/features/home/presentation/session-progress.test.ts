import { describe, expect, it } from 'vitest'
import { sessionProgress } from './session-progress'

const planned = (exerciseId: string, targetSets: number | null) => ({ exerciseId, targetSets })
const sets = (exerciseId: string, count: number) =>
  Array.from({ length: count }, () => ({ exerciseId }))

describe('sessionProgress', () => {
  it('counts a planned exercise done once its target sets are logged', () => {
    const plan = [1, 2, 3, 4, 5].map((n) => planned(`e-${n}`, 3))
    const done = [...sets('e-1', 3), ...sets('e-2', 3), ...sets('e-3', 4), ...sets('e-4', 2)]

    expect(sessionProgress(plan, done)).toEqual({ done: 3, planned: 5 })
  })

  it('counts an exercise with no target after one set', () => {
    expect(sessionProgress([planned('plank', null)], sets('plank', 1))).toEqual({
      done: 1,
      planned: 1,
    })
  })

  it('leaves exercises outside the plan out of both counts', () => {
    expect(sessionProgress([planned('bench', 3)], sets('curl', 5))).toEqual({
      done: 0,
      planned: 1,
    })
  })

  it('counts an exercise planned twice once', () => {
    expect(sessionProgress([planned('bench', 1), planned('bench', 1)], sets('bench', 1))).toEqual({
      done: 1,
      planned: 1,
    })
  })
})
