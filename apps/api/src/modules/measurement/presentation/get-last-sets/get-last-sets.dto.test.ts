import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { GetLastSetsDto } from './get-last-sets.dto.ts'

function failedProperties(query: unknown): readonly string[] {
  return validateSync(plainToInstance(GetLastSetsDto, query)).map((error) => error.property)
}

describe('the last-sets query contract', () => {
  it('accepts no session to exclude', () => {
    expect(failedProperties({})).toEqual([])
  })

  it('accepts the open session’s id, a UUIDv7', () => {
    expect(failedProperties({ excludingSession: Id.create().value })).toEqual([])
  })

  it('rejects anything that is not a UUID', () => {
    expect(failedProperties({ excludingSession: 'today' })).toContain('excludingSession')
  })
})
