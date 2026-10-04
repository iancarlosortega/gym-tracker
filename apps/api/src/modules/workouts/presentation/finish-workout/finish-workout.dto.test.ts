import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { FinishWorkoutDto } from './finish-workout.dto.ts'

function failedProperties(body: unknown): readonly string[] {
  return validateSync(plainToInstance(FinishWorkoutDto, body)).map((error) => error.property)
}

describe('the finish-workout request contract', () => {
  it('accepts an empty body, which asks for the server clock', () => {
    expect(failedProperties({})).toEqual([])
  })

  it('accepts the instant the user pressed finish', () => {
    expect(failedProperties({ finishedAt: '2026-10-04T10:30:00.000Z' })).toEqual([])
  })

  it('rejects an instant that is not a date', () => {
    expect(failedProperties({ finishedAt: 'after squats' })).toContain('finishedAt')
  })
})
