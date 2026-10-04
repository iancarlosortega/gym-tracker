import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import {
  archiveEquipment,
  createEquipment,
  getCatalogEquipment,
  getEquipmentUsage,
  renameEquipment,
} from './equipment.api.ts'

const clientAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })

  return { client, stub }
}

const smith = {
  id: 'q-1',
  name: 'Smith machine',
  kind: 'BARBELL',
  barKilograms: 15,
  stackPositions: null,
  archived: false,
}

describe('getCatalogEquipment', () => {
  it('asks for archived equipment too', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: { items: [smith] } }))

    expect(await getCatalogEquipment(client)).toEqual([smith])
    expect(stub.calls[0]?.url).toBe('/equipment?limit=200&includeArchived=true')
  })
})

describe('getEquipmentUsage', () => {
  it('reads how many exercises and sets use it', async () => {
    const { client, stub } = clientAnswering(() => ({
      status: 200,
      data: { exercises: 3, sets: 46 },
    }))

    expect(await getEquipmentUsage('q-1', client)).toEqual({ exercises: 3, sets: 46 })
    expect(stub.calls[0]?.url).toBe('/equipment/q-1/usage')
  })

  it('fails when the server cannot answer', async () => {
    const { client } = clientAnswering(() => ({ status: 500 }))

    await expect(getEquipmentUsage('q-1', client)).rejects.toThrow('500')
  })
})

describe('renameEquipment and archiveEquipment', () => {
  it('renames with only the new name', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: smith }))

    await renameEquipment('q-1', 'Smith', client)

    expect(stub.calls[0]?.method).toBe('patch')
    expect(stub.calls[0]?.url).toBe('/equipment/q-1')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual({ name: 'Smith' })
  })

  it('archives by id', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 201, data: smith }))

    await archiveEquipment('q-1', client)

    expect(stub.calls[0]?.method).toBe('post')
    expect(stub.calls[0]?.url).toBe('/equipment/q-1/archive')
  })
})

describe('createEquipment', () => {
  it('sends a barbell with its bar weight', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 201, data: smith }))

    expect(
      await createEquipment({ name: 'Smith machine', kind: 'BARBELL', barKilograms: 15 }, client),
    ).toEqual(smith)
    expect(stub.calls[0]?.url).toBe('/equipment')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual({
      name: 'Smith machine',
      kind: 'BARBELL',
      barKilograms: 15,
    })
  })
})
