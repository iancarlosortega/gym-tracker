import { EquipmentNotFoundError } from '@gym/domain/catalog/errors'
import type { EquipmentUsageRepository } from '@gym/domain/catalog/repositories/equipment-usage.repository'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryEquipmentRepository } from '../../testing/in-memory-equipment.repository.ts'
import { CreateEquipmentUseCase } from './create-equipment.use-case.ts'
import { GetEquipmentUsageUseCase } from './get-equipment-usage.use-case.ts'

const userId = Id.create().value
const otherUserId = Id.create().value

let repository: InMemoryEquipmentRepository
let usage: EquipmentUsageRepository
let getUsage: GetEquipmentUsageUseCase

beforeEach(() => {
  repository = new InMemoryEquipmentRepository()
  usage = { usageOf: vi.fn(async () => ({ exercises: 3, sets: 46 })) }
  getUsage = new GetEquipmentUsageUseCase(repository, usage)
})

const smithMachine = () =>
  new CreateEquipmentUseCase(repository).execute({
    userId,
    name: 'Smith machine',
    kind: 'BARBELL',
    barKilograms: 15,
  })

describe('reading how much equipment is used', () => {
  it('answers for the owner', async () => {
    const smith = await smithMachine()

    expect(await getUsage.execute({ userId, equipmentId: smith.id.value })).toEqual({
      exercises: 3,
      sets: 46,
    })
    expect(usage.usageOf).toHaveBeenCalledWith(userId, smith.id.value)
  })

  it('refuses someone else’s equipment without reading anything', async () => {
    const smith = await smithMachine()

    await expect(
      getUsage.execute({ userId: otherUserId, equipmentId: smith.id.value }),
    ).rejects.toBeInstanceOf(EquipmentNotFoundError)
    expect(usage.usageOf).not.toHaveBeenCalled()
  })
})
