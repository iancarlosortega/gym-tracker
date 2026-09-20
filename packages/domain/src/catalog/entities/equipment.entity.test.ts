import { fromKilograms } from '@domain/measurement/value-objects/grams.vo.js'
import { stackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'
import { describe, expect, it } from 'vitest'
import { Equipment } from './equipment.entity.ts'

const userId = Id.restore('0199a1f0-0000-7000-8000-00000000f001')

const olympicBar = () =>
  Equipment.create({ userId, name: 'Olympic Bar', kind: 'BARBELL', barGrams: fromKilograms(20) })

const rowMachine = () =>
  Equipment.create({ userId, name: 'Seated Row', kind: 'STACK', stackPositions: 15 })

const dumbbells = () => Equipment.create({ userId, name: 'Dumbbells', kind: 'FREE_WEIGHT' })

describe('creating a barbell', () => {
  it('carries the bar weight it was defined with', () => {
    expect(olympicBar().barGrams).toBe(20_000)
  })

  it('refuses to exist without a bar weight, because a per-side entry could never resolve', () => {
    expect(() => Equipment.create({ userId, name: 'Mystery Bar', kind: 'BARBELL' })).toThrow(
      /bar weight/i,
    )
  })

  it('has no stack positions', () => {
    expect(olympicBar().stackPositions).toBeNull()
  })
})

describe('creating a stack machine', () => {
  it('carries the number of positions it has', () => {
    expect(rowMachine().stackPositions).toBe(15)
  })

  it('refuses to exist without a position count, so an entry cannot be checked', () => {
    expect(() => Equipment.create({ userId, name: 'Row', kind: 'STACK' })).toThrow(/positions/i)
  })

  it('refuses a position count that is not a positive whole number', () => {
    expect(() =>
      Equipment.create({ userId, name: 'Row', kind: 'STACK', stackPositions: 0 }),
    ).toThrow(/positions/i)
  })

  it('has no bar weight, because a stack has no bar', () => {
    expect(rowMachine().barGrams).toBeNull()
  })
})

describe('what a machine will accept', () => {
  it('accepts a position it has', () => {
    expect(rowMachine().allowsPosition(stackPosition(15))).toBe(true)
  })

  it('refuses a position beyond the stack', () => {
    expect(rowMachine().allowsPosition(stackPosition(16))).toBe(false)
  })

  it('refuses any position on equipment that is not a stack', () => {
    expect(olympicBar().allowsPosition(stackPosition(1))).toBe(false)
  })
})

describe('which measurements equipment can express', () => {
  it('lets a barbell be logged per side or as a total', () => {
    expect(olympicBar().supports('PER_SIDE')).toBe(true)
    expect(olympicBar().supports('TOTAL')).toBe(true)
  })

  it('refuses to let a barbell be logged as a stack position', () => {
    expect(olympicBar().supports('STACK_POSITION')).toBe(false)
  })

  it('lets a stack be logged only by position', () => {
    expect(rowMachine().supports('STACK_POSITION')).toBe(true)
    expect(rowMachine().supports('PER_SIDE')).toBe(false)
    expect(rowMachine().supports('TOTAL')).toBe(false)
  })

  it('lets a free weight be logged only as a total, since it has no sides and no stack', () => {
    expect(dumbbells().supports('TOTAL')).toBe(true)
    expect(dumbbells().supports('PER_SIDE')).toBe(false)
  })
})

describe('changing equipment', () => {
  it('corrects a bar weight by returning a new instance', () => {
    const bar = olympicBar()
    const corrected = bar.withBarWeight(fromKilograms(15))

    expect(corrected.barGrams).toBe(15_000)
    expect(bar.barGrams).toBe(20_000)
    expect(corrected.equals(bar)).toBe(true)
  })

  it('refuses a bar weight on equipment that has no bar', () => {
    expect(() => rowMachine().withBarWeight(fromKilograms(20))).toThrow(/bar/i)
  })

  it('renames and archives without losing identity', () => {
    const bar = olympicBar()
    const changed = bar.renamedTo('Competition Bar').archivedAt(new Date())

    expect(changed.name.value).toBe('Competition Bar')
    expect(changed.isArchived).toBe(true)
    expect(changed.id.equals(bar.id)).toBe(true)
  })
})
