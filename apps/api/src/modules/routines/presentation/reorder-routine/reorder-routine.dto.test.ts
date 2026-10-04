import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { ReorderRoutineDto } from './reorder-routine.dto.ts'

function failedProperties(body: unknown): readonly string[] {
  return validateSync(plainToInstance(ReorderRoutineDto, body)).map((error) => error.property)
}

describe('the reorder-routine request contract', () => {
  it('accepts the entry ids the API hands out, which are UUIDv7', () => {
    expect(failedProperties({ entryIds: [Id.create().value, Id.create().value] })).toEqual([])
  })

  it('rejects an id that is not a UUID', () => {
    expect(failedProperties({ entryIds: ['squat'] })).toContain('entryIds')
  })

  it('rejects an empty order', () => {
    expect(failedProperties({ entryIds: [] })).toContain('entryIds')
  })
})
