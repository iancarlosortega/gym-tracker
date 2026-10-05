import { describe, expect, it } from 'vitest'
import type { ExerciseProgressionResponse } from '../infrastructure/statistics.api'
import { inDisplayUnit } from './progression-unit'

type Series = ExerciseProgressionResponse['series'][number]

const series = (unit: Series['unit'], value: number) =>
  ({
    mode: unit === 'position' ? 'STACK_POSITION' : 'TOTAL',
    unit,
    points: [{ periodStart: '2026-09-28', value, reps: 8, change: 'first' }],
  }) as unknown as Series

describe('inDisplayUnit', () => {
  it('reads a weight series in pounds when pounds are chosen', () => {
    expect(inDisplayUnit(series('kilograms', 100), 'LB').points[0]?.value).toBe(220.5)
  })

  it('leaves kilograms alone when kilograms are chosen', () => {
    expect(inDisplayUnit(series('kilograms', 100), 'KG').points[0]?.value).toBe(100)
  })

  it('never converts pin positions, which are not a mass', () => {
    expect(inDisplayUnit(series('position', 7), 'LB').points[0]?.value).toBe(7)
  })
})
