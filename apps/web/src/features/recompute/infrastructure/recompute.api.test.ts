import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api-client'
import { type StubAnswer, stubAdapter } from '@/lib/testing/stub-adapter'
import { StalePreviewError } from '../application/stale-preview.error.ts'
import { applyRecompute, previewRecompute } from './recompute.api.ts'

const clientAnswering = (answer: () => StubAnswer) => {
  const stub = stubAdapter(answer)
  const client = createApiClient({
    baseURL: 'https://api.test',
    adapter: stub.adapter,
    onUnauthenticated: () => {},
  })

  return { client, stub }
}

const preview = { equipmentId: 'q-1', affectedSets: 2, changes: [], records: [], previewToken: 't' }

describe('previewRecompute', () => {
  it('asks the server what a correction would change', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: preview }))

    expect(await previewRecompute('q-1', client)).toEqual(preview)
    expect(stub.calls[0]?.method).toBe('post')
    expect(stub.calls[0]?.url).toBe('/equipment/q-1/recompute/preview')
  })
})

describe('applyRecompute', () => {
  it('applies exactly the previewed change', async () => {
    const { client, stub } = clientAnswering(() => ({ status: 200, data: preview }))

    await applyRecompute('q-1', 't', client)

    expect(stub.calls[0]?.url).toBe('/equipment/q-1/recompute/apply')
    expect(JSON.parse(String(stub.calls[0]?.data))).toEqual({ previewToken: 't' })
  })

  it('names a moved history as stale rather than as a generic failure', async () => {
    const { client } = clientAnswering(() => ({ status: 409 }))

    await expect(applyRecompute('q-1', 't', client)).rejects.toBeInstanceOf(StalePreviewError)
  })

  it('lets any other failure through as it is', async () => {
    const { client } = clientAnswering(() => ({ status: 500 }))
    const attempt = applyRecompute('q-1', 't', client)

    await expect(attempt).rejects.toThrow('500')
    await expect(attempt).rejects.not.toBeInstanceOf(StalePreviewError)
  })
})
