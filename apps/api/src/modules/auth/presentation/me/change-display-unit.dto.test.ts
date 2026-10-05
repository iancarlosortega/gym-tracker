import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { ChangeDisplayUnitDto } from './change-display-unit.dto.ts'

const failed = (body: unknown) =>
  validateSync(plainToInstance(ChangeDisplayUnitDto, body)).map((error) => error.property)

describe('the display-unit request contract', () => {
  it.each(['KG', 'LB'])('accepts %s', (displayUnit) => {
    expect(failed({ displayUnit })).toEqual([])
  })

  it('rejects anything else', () => {
    expect(failed({ displayUnit: 'stone' })).toContain('displayUnit')
    expect(failed({})).toContain('displayUnit')
  })
})
