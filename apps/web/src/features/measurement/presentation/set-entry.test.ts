import { fromKilograms, fromPounds } from '@gym/domain/measurement/value-objects/grams.vo'
import { describe, expect, it } from 'vitest'
import { correctionFor, enteredValue, entryFor, weightTile } from './set-entry.ts'

describe('the weight tile', () => {
  it('names a per-side load by side or by hand', () => {
    expect(weightTile('PER_SIDE', false, 'KG').label).toBe('Weight per side')
    expect(weightTile('PER_SIDE', true, 'KG').label).toBe('Weight per hand')
  })

  it('has no unit for a pin position', () => {
    expect(weightTile('STACK_POSITION', false, 'LB')).toMatchObject({
      label: 'Pin position',
      unit: undefined,
    })
  })
})

describe('an entry typed in the user’s unit', () => {
  it('counts no bar when none is set, never a 0 kg bar', () => {
    expect(entryFor('PER_SIDE', 20, null, 'KG').toJSON()).toEqual({
      mode: 'PER_SIDE',
      perSideGrams: fromKilograms(20),
      barGrams: null,
    })
  })

  it('reads pounds as pounds', () => {
    expect(entryFor('TOTAL', 135, null, 'LB').toJSON()).toEqual({
      mode: 'TOTAL',
      grams: fromPounds(135),
    })
  })
})

describe('a correction typed in the user’s unit', () => {
  it('is grams for a set measured by mass', () => {
    expect(correctionFor('PER_SIDE', 25, 'KG')).toEqual({ grams: fromKilograms(25) })
    expect(correctionFor('TOTAL', 135, 'LB')).toEqual({ grams: fromPounds(135) })
  })

  it('is a position for a stack set', () => {
    expect(correctionFor('STACK_POSITION', 8, 'KG')).toEqual({ position: 8 })
  })
})

describe('the value a set was entered with', () => {
  it('shows the per-side value as typed, not the resolved total', () => {
    expect(
      enteredValue({ mode: 'PER_SIDE', rawGrams: fromKilograms(20), position: null }, 'KG'),
    ).toBe('20')
  })

  it('shows a total in the user’s unit', () => {
    expect(enteredValue({ mode: 'TOTAL', rawGrams: fromPounds(135), position: null }, 'LB')).toBe(
      '135',
    )
  })

  it('shows a pin as its position', () => {
    expect(enteredValue({ mode: 'STACK_POSITION', rawGrams: null, position: 7 }, 'KG')).toBe('7')
  })
})
