import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { ReorderRoutinesDto } from './reorder-routines.dto.ts'

function failedProperties(body: unknown): readonly string[] {
  return validateSync(plainToInstance(ReorderRoutinesDto, body)).map((error) => error.property)
}

describe('the reorder-routines request contract', () => {
  it('accepts the routine ids the API hands out', () => {
    expect(failedProperties({ routineIds: [Id.create().value, Id.create().value] })).toEqual([])
  })

  it('rejects an id that is not a UUID, and an empty order', () => {
    expect(failedProperties({ routineIds: ['legs'] })).toContain('routineIds')
    expect(failedProperties({ routineIds: [] })).toContain('routineIds')
  })
})
