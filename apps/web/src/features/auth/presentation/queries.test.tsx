/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { MeResponse } from '../infrastructure/auth.api'
import { authKeys, useChangeDisplayUnit, useDisplayUnit } from './queries'

const server = vi.hoisted(() => ({
  unit: 'KG',
  pending: [] as (() => void)[],
  refuse: false,
}))

vi.mock('../infrastructure/auth.api', () => ({
  getMe: async () => ({ id: 'u-1', email: 'ian@example.com', displayUnit: server.unit }),
  changeDisplayUnit: (displayUnit: string) =>
    new Promise((resolve, reject) => {
      server.pending.push(() => {
        if (server.refuse) {
          reject(new Error('refused'))
          return
        }
        server.unit = displayUnit
        resolve({ id: 'u-1', email: 'ian@example.com', displayUnit })
      })
    }),
}))

const me = (displayUnit: string): MeResponse => ({
  id: 'u-1',
  email: 'ian@example.com',
  displayUnit,
})

const setup = () => {
  server.unit = 'KG'
  server.pending = []
  server.refuse = false
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(authKeys.me(), me('KG'))
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const view = renderHook(() => ({ unit: useDisplayUnit(), change: useChangeDisplayUnit() }), {
    wrapper,
  })
  return { client, view }
}

/** Let the server answer the oldest request it is holding. */
const answerNext = async () => {
  await waitFor(() => expect(server.pending.length).toBeGreaterThan(0))
  await act(async () => server.pending.shift()?.())
}

describe('useChangeDisplayUnit', () => {
  it('shows the new unit before the server answers', async () => {
    const { view } = setup()

    act(() => view.result.current.change.mutate('LB'))

    await waitFor(() => expect(view.result.current.unit).toBe('LB'))
    expect(server.unit).toBe('KG')
    await answerNext()
  })

  it('puts the old unit back when the server refuses', async () => {
    const { view } = setup()
    server.refuse = true

    act(() => view.result.current.change.mutate('LB'))
    await waitFor(() => expect(view.result.current.unit).toBe('LB'))
    await answerNext()

    await waitFor(() => expect(view.result.current.change.isError).toBe(true))
    expect(view.result.current.unit).toBe('KG')
  })

  it('ends on the last unit tapped, on screen and on the server', async () => {
    const { view } = setup()

    act(() => view.result.current.change.mutate('LB'))
    act(() => view.result.current.change.mutate('KG'))
    await waitFor(() => expect(view.result.current.unit).toBe('KG'))
    // The second tap waits for the first to reach the server.
    expect(server.pending).toHaveLength(1)

    await answerNext()
    await answerNext()

    await waitFor(() => expect(view.result.current.change.isPending).toBe(false))
    expect(server.unit).toBe('KG')
    expect(view.result.current.unit).toBe('KG')
  })
})
