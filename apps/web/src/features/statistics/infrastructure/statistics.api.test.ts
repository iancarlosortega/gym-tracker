import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { stubAdapter } from '@/lib/testing/stub-adapter'
import { getExerciseProgression, getWeekComparison } from './statistics.api.ts'

const clientAnswering = () => {
  const stub = stubAdapter(() => ({ status: 200, data: {} }))
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })
  return { client, stub }
}

describe('statistics reads say where the phone is', () => {
  it("sends the phone's zone with the week", async () => {
    const { client, stub } = clientAnswering()

    await getWeekComparison(new Date('2026-09-28T05:00:00Z'), 'America/Guayaquil', client)

    expect(stub.calls[0]?.params).toEqual({
      weekStart: '2026-09-28T05:00:00.000Z',
      timeZone: 'America/Guayaquil',
    })
  })

  it("sends the phone's zone with a progression", async () => {
    const { client, stub } = clientAnswering()

    await getExerciseProgression(
      'e-1',
      new Date('2026-07-06T05:00:00Z'),
      new Date('2026-10-05T05:00:00Z'),
      'America/Guayaquil',
      client,
    )

    expect(stub.calls[0]?.params).toMatchObject({ timeZone: 'America/Guayaquil' })
  })
})
