import axios, { isAxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { stubAdapter } from './stub-adapter.ts'

describe('stubAdapter', () => {
  it('resolves a 2xx answer with its data and records the request', async () => {
    const stub = stubAdapter(() => ({ status: 200, data: { ok: true } }))
    const client = axios.create({ baseURL: 'https://api.test', adapter: stub.adapter })

    const response = await client.get('/thing')

    expect(response.data).toEqual({ ok: true })
    expect(stub.calls).toHaveLength(1)
    expect(stub.calls[0]?.url).toBe('/thing')
  })

  it('rejects a non-2xx answer the way a real adapter does', async () => {
    const stub = stubAdapter(() => ({ status: 409 }))
    const client = axios.create({ adapter: stub.adapter })

    const failure = await client.post('/thing').catch((error: unknown) => error)

    expect(isAxiosError(failure)).toBe(true)
    expect(isAxiosError(failure) && failure.response?.status).toBe(409)
  })
})
