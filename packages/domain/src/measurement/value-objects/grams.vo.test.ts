import { InvalidGramsError } from '@domain/measurement/errors.js'
import {
  addGrams,
  doubleGrams,
  fromKilograms,
  fromPounds,
  grams,
  toKilograms,
  toPounds,
} from '@domain/measurement/value-objects/grams.vo.js'
import { describe, expect, it } from 'vitest'

describe('grams', () => {
  it('accepts a non-negative integer', () => {
    expect(grams(20_000)).toBe(20_000)
    expect(grams(0)).toBe(0)
  })

  it('rejects a negative value', () => {
    expect(() => grams(-1)).toThrow(InvalidGramsError)
    expect(() => grams(-1)).toThrow(/negative/i)
  })

  it('rejects a fractional value, because grams are the smallest unit', () => {
    expect(() => grams(20.5)).toThrow(InvalidGramsError)
  })

  it('rejects a non-finite value', () => {
    expect(() => grams(Number.NaN)).toThrow(InvalidGramsError)
    expect(() => grams(Number.POSITIVE_INFINITY)).toThrow(InvalidGramsError)
  })
})

describe('unit conversion', () => {
  it('converts kilograms to grams', () => {
    expect(fromKilograms(20)).toBe(20_000)
    expect(fromKilograms(22.5)).toBe(22_500)
  })

  it('converts pounds to grams using the exact international pound', () => {
    expect(fromPounds(45)).toBe(20_412)
  })

  it('does not drift when the display unit is switched repeatedly', () => {
    const stored = fromKilograms(22.5)

    let kilograms = toKilograms(stored)
    for (let index = 0; index < 10; index += 1) {
      const pounds = toPounds(stored)
      expect(pounds).toBeGreaterThan(0)
      kilograms = toKilograms(stored)
    }

    expect(kilograms).toBe(22.5)
  })

  it('round-trips every quarter-kilogram plate increment', () => {
    for (let quarter = 0; quarter <= 400; quarter += 1) {
      const kilograms = quarter / 4
      expect(toKilograms(fromKilograms(kilograms))).toBe(kilograms)
    }
  })
})

describe('arithmetic', () => {
  it('adds two gram values', () => {
    expect(addGrams(grams(40_000), grams(20_000))).toBe(60_000)
  })

  it('doubles a gram value', () => {
    expect(doubleGrams(grams(20_000))).toBe(40_000)
  })
})
