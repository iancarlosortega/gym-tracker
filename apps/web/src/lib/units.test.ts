import { fromPounds } from '@gym/domain/measurement/value-objects/grams.vo'
import { describe, expect, it } from 'vitest'
import { fromDisplay, gramsToDisplay, kilogramsToDisplay, spokenUnit, unitLabel } from './units.ts'

describe('units', () => {
  it('reads kilograms as typed', () => {
    expect(fromDisplay(22.5, 'KG')).toBe(22_500)
    expect(kilogramsToDisplay(22.5, 'KG')).toBe(22.5)
  })

  it('round-trips pounds: 60 lb is stored and read back as 60 lb', () => {
    const stored = fromDisplay(60, 'LB')

    expect(stored).toBe(fromPounds(60))
    expect(gramsToDisplay(stored, 'LB')).toBe(60)
  })

  it('shows kilogram history in pounds, to a tenth', () => {
    expect(kilogramsToDisplay(60, 'LB')).toBe(132.3)
    expect(gramsToDisplay(60_000, 'LB')).toBe(132.3)
  })

  it('names the unit for reading and for listening', () => {
    expect(unitLabel('LB')).toBe('lb')
    expect(spokenUnit('KG')).toBe('kilograms')
  })
})
