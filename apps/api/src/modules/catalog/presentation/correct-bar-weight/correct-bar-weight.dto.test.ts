import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { CorrectBarWeightDto } from './correct-bar-weight.dto.ts'

function failedProperties(body: unknown): readonly string[] {
  return validateSync(plainToInstance(CorrectBarWeightDto, body)).map((error) => error.property)
}

describe('the correct-bar-weight request contract', () => {
  it('accepts a bar weight in kilograms', () => {
    expect(failedProperties({ barKilograms: 20 })).toEqual([])
  })

  it('accepts null, which stops the bar from counting', () => {
    expect(failedProperties({ barKilograms: null })).toEqual([])
  })

  it('rejects a missing value, so an empty body never clears a bar by accident', () => {
    expect(failedProperties({})).toContain('barKilograms')
  })

  it('rejects a bar that weighs nothing or less', () => {
    expect(failedProperties({ barKilograms: 0 })).toContain('barKilograms')
  })
})
