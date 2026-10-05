import { fromKilograms, fromPounds } from '@domain/measurement/value-objects/grams.vo.js'
import { LoadEntry } from '@domain/measurement/value-objects/load-entry.vo.js'
import { isResolved } from '@domain/measurement/value-objects/mass-resolution.vo.js'
import { stackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'
import { describe, expect, it } from 'vitest'

describe('load entry construction', () => {
  it('builds a TOTAL entry', () => {
    expect(LoadEntry.total(fromKilograms(22.5)).toJSON()).toEqual({
      mode: 'TOTAL',
      grams: 22_500,
    })
  })

  it('builds a PER_SIDE entry carrying its bar weight', () => {
    expect(LoadEntry.perSide(fromKilograms(20), fromKilograms(20)).toJSON()).toEqual({
      mode: 'PER_SIDE',
      perSideGrams: 20_000,
      barGrams: 20_000,
    })
  })

  it('builds a STACK_POSITION entry', () => {
    const entry = LoadEntry.stack(stackPosition(7))
    expect(entry.toJSON()).toEqual({ mode: 'STACK_POSITION', position: 7 })
    expect(entry.position).toBe(7)
  })

  it('reports no position for a ratio-scale entry', () => {
    expect(LoadEntry.total(fromKilograms(20)).position).toBeNull()
  })
})

describe('load entry parsing', () => {
  it('rejects an entry with no measurement mode', () => {
    expect(() => LoadEntry.from({ grams: 20_000 })).toThrow(/mode/i)
  })

  it('rejects an unknown measurement mode', () => {
    expect(() => LoadEntry.from({ mode: 'NEWTONS', grams: 20_000 })).toThrow(/unknown/i)
  })

  it('reads a PER_SIDE entry with no bar weight as one that counts no bar', () => {
    const entry = LoadEntry.from({ mode: 'PER_SIDE', perSideGrams: 20_000 })

    expect(entry.toJSON()).toEqual({ mode: 'PER_SIDE', perSideGrams: 20_000, barGrams: null })
    expect(entry.resolveMass()).toEqual({ kind: 'resolved', grams: 40_000 })
  })

  it('accepts a well-formed PER_SIDE entry', () => {
    const entry = LoadEntry.from({ mode: 'PER_SIDE', perSideGrams: 20_000, barGrams: 20_000 })
    expect(entry.mode).toBe('PER_SIDE')
    expect(entry.resolveMass()).toEqual({ kind: 'resolved', grams: 60_000 })
  })
})

describe('resolveMass for ratio-scale modes', () => {
  it('resolves a TOTAL entry as entered', () => {
    expect(LoadEntry.total(fromKilograms(22.5)).resolveMass()).toEqual({
      kind: 'resolved',
      grams: 22_500,
    })
  })

  it("resolves the user's bench press: 20 kg per side on a 20 kg bar is 60 kg", () => {
    expect(LoadEntry.perSide(fromKilograms(20), fromKilograms(20)).resolveMass()).toEqual({
      kind: 'resolved',
      grams: 60_000,
    })
  })

  it('resolves 20 kg per side on a Smith whose bar is not counted as 40 kg', () => {
    expect(LoadEntry.perSide(fromKilograms(20), null).resolveMass()).toEqual({
      kind: 'resolved',
      grams: 40_000,
    })
  })

  it('resolves 60 lb per hand on dumbbells as 120 lb', () => {
    expect(LoadEntry.perSide(fromPounds(60)).resolveMass()).toEqual({
      kind: 'resolved',
      grams: 2 * fromPounds(60),
    })
  })

  it('resolves 15 kg per side on a 10 kg bar as 40 kg', () => {
    expect(LoadEntry.perSide(fromKilograms(15), fromKilograms(10)).resolveMass()).toEqual({
      kind: 'resolved',
      grams: 40_000,
    })
  })

  it('resolves a bar-only entry as the bar weight', () => {
    expect(LoadEntry.perSide(fromKilograms(0), fromKilograms(20)).resolveMass()).toEqual({
      kind: 'resolved',
      grams: 20_000,
    })
  })
})

describe('resolveMass for the ordinal mode', () => {
  it('refuses to produce a mass for a stack position', () => {
    expect(LoadEntry.stack(stackPosition(7)).resolveMass().kind).toBe('not-applicable')
  })

  it('never returns zero for a stack position, because zero would pollute an average', () => {
    const resolution = LoadEntry.stack(stackPosition(7)).resolveMass()
    expect(resolution).not.toHaveProperty('grams')
    expect(isResolved(resolution)).toBe(false)
  })

  it('explains why no mass is available', () => {
    const resolution = LoadEntry.stack(stackPosition(1)).resolveMass()
    if (resolution.kind !== 'not-applicable') {
      throw new Error('expected a not-applicable resolution')
    }
    expect(resolution.reason).toMatch(/ordinal/i)
  })
})
