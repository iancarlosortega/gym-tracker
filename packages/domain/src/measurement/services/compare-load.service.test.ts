import { compareStackPositions } from '@domain/measurement/services/compare-load.service.js'
import { stackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'
import { describe, expect, it } from 'vitest'

const latPulldown = 'exercise-lat-pulldown'
const chestPress = 'exercise-chest-press'

describe('comparing stack positions', () => {
  it('orders two positions of the same exercise', () => {
    const lighter = { exerciseId: latPulldown, position: stackPosition(6) }
    const heavier = { exerciseId: latPulldown, position: stackPosition(7) }

    expect(compareStackPositions(heavier, lighter)).toBeGreaterThan(0)
    expect(compareStackPositions(lighter, heavier)).toBeLessThan(0)
    expect(compareStackPositions(lighter, lighter)).toBe(0)
  })

  it('refuses to compare positions across different exercises', () => {
    const onePulldown = { exerciseId: latPulldown, position: stackPosition(7) }
    const onePress = { exerciseId: chestPress, position: stackPosition(7) }

    expect(() => compareStackPositions(onePulldown, onePress)).toThrow(/different exercises/i)
  })
})
