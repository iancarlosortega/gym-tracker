import { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { describe, expect, it } from 'vitest'
import { equipmentMapper } from './equipment.mapper.ts'

const userId = Id.create()

const roundTrip = (model: Equipment) => {
  const row = equipmentMapper.toRow(model)
  return equipmentMapper.toDomain({
    ...row,
    barGrams: row.barGrams ?? null,
    stackPositions: row.stackPositions ?? null,
    archivedAt: row.archivedAt ?? null,
    createdAt: row.createdAt ?? new Date(),
  } as Parameters<typeof equipmentMapper.toDomain>[0])
}

describe('the equipment mapper', () => {
  it('keeps a bar that is not counted as not counted, never as a 0 kg bar', () => {
    const smith = Equipment.create({ userId, name: 'Smith machine', kind: 'BARBELL' })

    expect(roundTrip(smith).barGrams).toBeNull()
  })

  it('keeps a counted bar weight', () => {
    const bar = Equipment.create({
      userId,
      name: 'Olympic bar',
      kind: 'BARBELL',
      barGrams: fromKilograms(20),
    })

    expect(roundTrip(bar).barGrams).toBe(20_000)
  })
})
