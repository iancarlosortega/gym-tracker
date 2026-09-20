import {
  EquipmentCannotMeasureThatWayError,
  EquipmentNotFoundError,
} from '@gym/domain/catalog/errors'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { beforeEach, describe, expect, it } from 'vitest'
import { FixedClock } from '../../../auth/testing/in-memory-auth.ts'
import { InMemoryEquipmentRepository } from '../../testing/in-memory-equipment.repository.ts'
import { ArchiveEquipmentUseCase } from './archive-equipment.use-case.ts'
import { CorrectBarWeightUseCase } from './correct-bar-weight.use-case.ts'
import { CreateEquipmentUseCase } from './create-equipment.use-case.ts'
import { ListEquipmentUseCase } from './list-equipment.use-case.ts'
import { RenameEquipmentUseCase } from './rename-equipment.use-case.ts'

const userId = Id.create().value
const otherUserId = Id.create().value

let repository: InMemoryEquipmentRepository
let create: CreateEquipmentUseCase
let rename: RenameEquipmentUseCase
let correctBar: CorrectBarWeightUseCase
let archive: ArchiveEquipmentUseCase
let list: ListEquipmentUseCase

beforeEach(() => {
  repository = new InMemoryEquipmentRepository()
  create = new CreateEquipmentUseCase(repository)
  rename = new RenameEquipmentUseCase(repository)
  correctBar = new CorrectBarWeightUseCase(repository)
  archive = new ArchiveEquipmentUseCase(
    repository,
    new FixedClock(new Date('2026-09-19T12:00:00Z')),
  )
  list = new ListEquipmentUseCase(repository)
})

const olympicBar = () =>
  create.execute({ userId, name: 'Olympic Bar', kind: 'BARBELL', barKilograms: 20 })

const rowMachine = () =>
  create.execute({ userId, name: 'Seated Row', kind: 'STACK', stackPositions: 15 })

describe('creating equipment', () => {
  it('converts kilograms at the edge into grams in the domain', async () => {
    expect((await olympicBar()).barGrams).toBe(20_000)
  })

  it('refuses a barbell with no bar weight', async () => {
    await expect(create.execute({ userId, name: 'Mystery Bar', kind: 'BARBELL' })).rejects.toThrow(
      /bar weight/i,
    )
  })

  it('refuses a stack with no position count', async () => {
    await expect(create.execute({ userId, name: 'Row', kind: 'STACK' })).rejects.toThrow(
      /positions/i,
    )
  })

  it('reuses the same machine rather than splitting its history', async () => {
    const first = await olympicBar()
    const again = await create.execute({
      userId,
      name: 'olympic bar',
      kind: 'BARBELL',
      barKilograms: 20,
    })

    expect(again.id.equals(first.id)).toBe(true)
    expect(repository.equipment.size).toBe(1)
  })
})

describe('correcting a bar weight', () => {
  it('applies the correction going forward', async () => {
    const bar = await olympicBar()

    const corrected = await correctBar.execute({
      userId,
      equipmentId: bar.id.value,
      barKilograms: 15,
    })

    expect(corrected.barGrams).toBe(15_000)
  })

  it('refuses on equipment that has no bar', async () => {
    const machine = await rowMachine()

    await expect(
      correctBar.execute({ userId, equipmentId: machine.id.value, barKilograms: 20 }),
    ).rejects.toThrow(EquipmentCannotMeasureThatWayError)
  })

  it('refuses equipment belonging to someone else', async () => {
    const bar = await olympicBar()

    await expect(
      correctBar.execute({ userId: otherUserId, equipmentId: bar.id.value, barKilograms: 15 }),
    ).rejects.toThrow(EquipmentNotFoundError)
  })
})

describe('listing equipment', () => {
  it('hides archived equipment from routine building', async () => {
    const bar = await olympicBar()
    await rowMachine()

    await archive.execute({ userId, equipmentId: bar.id.value })

    const available = await list.execute({ userId })
    expect(available.items.map((model) => model.name.value)).toEqual(['Seated Row'])
    expect(available.total).toBe(1)
  })

  it('filters by kind, so a per-side exercise only offers barbells', async () => {
    await olympicBar()
    await rowMachine()

    const barbells = await list.execute({ userId, kind: 'BARBELL' })

    expect(barbells.items).toHaveLength(1)
    expect(barbells.items[0]?.kind).toBe('BARBELL')
  })

  it('is bounded even when no limit is asked for', async () => {
    expect((await list.execute({ userId })).limit).toBe(50)
  })

  it("never returns another user's equipment", async () => {
    await create.execute({ userId: otherUserId, name: 'Theirs', kind: 'FREE_WEIGHT' })

    expect((await list.execute({ userId })).items).toHaveLength(0)
  })
})

describe('renaming equipment', () => {
  it('keeps identity so logged sets still point at it', async () => {
    const bar = await olympicBar()

    const renamed = await rename.execute({
      userId,
      equipmentId: bar.id.value,
      name: 'Competition Bar',
    })

    expect(renamed.name.value).toBe('Competition Bar')
    expect(renamed.id.equals(bar.id)).toBe(true)
  })

  it('refuses an unknown piece of equipment', async () => {
    await expect(
      rename.execute({ userId, equipmentId: Id.create().value, name: 'Nothing' }),
    ).rejects.toThrow(EquipmentNotFoundError)
  })
})
