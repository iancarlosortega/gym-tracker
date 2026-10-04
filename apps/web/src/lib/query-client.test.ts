import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { shouldRetry } from './query-client.ts'

const answered = (status: number): AxiosError => {
  const config = { headers: {} } as InternalAxiosRequestConfig
  const response = { status, statusText: '', data: null, headers: {}, config } as AxiosResponse

  return new AxiosError(`status ${status}`, undefined, config, undefined, response)
}

describe('shouldRetry', () => {
  it('never retries a lapsed session: the user is already on the way to sign in', () => {
    expect(shouldRetry(0, answered(401))).toBe(false)
  })

  it('retries a server failure up to three times', () => {
    expect(shouldRetry(0, answered(500))).toBe(true)
    expect(shouldRetry(2, answered(500))).toBe(true)
    expect(shouldRetry(3, answered(500))).toBe(false)
  })

  it('retries an unreachable server', () => {
    expect(shouldRetry(0, new TypeError('Failed to fetch'))).toBe(true)
  })
})
