import { MutationObserver, QueryClient, QueryObserver } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { optimisticMutation, patch } from './optimistic'

/** A promise the test settles by hand, standing in for a slow server. */
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const KEY = ['list'] as const

const setup = (initial: readonly string[]) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(KEY, initial)
  const refetch = vi.fn(async () => client.getQueryData<readonly string[]>(KEY) ?? [])
  // A screen showing the list, so invalidating it refetches.
  new QueryObserver(client, {
    queryKey: KEY,
    queryFn: refetch,
    staleTime: Number.POSITIVE_INFINITY,
  }).subscribe(() => {})
  return { client, refetch, read: () => client.getQueryData<readonly string[]>(KEY) }
}

const appendOptions = (server: (item: string) => Promise<void>, scope?: string) =>
  optimisticMutation<string, void>({
    mutationKey: ['append'],
    scope,
    mutationFn: server,
    patches: (item) => [patch<readonly string[]>(KEY, (old) => [...old, item])],
    invalidates: [KEY],
  })

const run = (client: QueryClient, options: ReturnType<typeof appendOptions>, item: string) =>
  new MutationObserver(client, options).mutate(item).catch(() => undefined)

describe('optimisticMutation', () => {
  it('shows the change before the server answers', async () => {
    const { client, read } = setup(['a'])
    const server = deferred<void>()

    void run(
      client,
      appendOptions(() => server.promise),
      'b',
    )
    await vi.waitFor(() => expect(read()).toEqual(['a', 'b']))

    server.resolve()
  })

  it('restores the previous value when the only pending change fails', async () => {
    const { client, read } = setup(['a'])
    const server = deferred<void>()

    const done = run(
      client,
      appendOptions(() => server.promise),
      'b',
    )
    await vi.waitFor(() => expect(read()).toEqual(['a', 'b']))
    server.reject(new Error('refused'))
    await done

    expect(read()).toEqual(['a'])
  })

  it('does not undo later changes when an earlier one fails', async () => {
    const { client, read } = setup(['a'])
    const first = deferred<void>()
    const second = deferred<void>()
    const calls = [first, second]
    const options = appendOptions(() => (calls.shift() as typeof first).promise)

    const one = run(client, options, 'b')
    const two = run(client, options, 'c')
    await vi.waitFor(() => expect(read()).toEqual(['a', 'b', 'c']))

    first.reject(new Error('refused'))
    await one

    expect(read()).toEqual(['a', 'b', 'c'])
    second.resolve()
    await two
  })

  it('refetches once, after the last pending change settles', async () => {
    const { client, refetch } = setup(['a'])
    const first = deferred<void>()
    const second = deferred<void>()
    const calls = [first, second]
    const options = appendOptions(() => (calls.shift() as typeof first).promise)

    const one = run(client, options, 'b')
    const two = run(client, options, 'c')
    first.resolve()
    await one
    expect(refetch).not.toHaveBeenCalled()

    second.resolve()
    await two
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('sends changes in the same scope one after another, in tap order', async () => {
    const { client } = setup([])
    const order: string[] = []
    const first = deferred<void>()
    const server = vi.fn(async (item: string) => {
      order.push(`start ${item}`)
      if (item === 'b') {
        await first.promise
      }
      order.push(`end ${item}`)
    })
    const options = appendOptions(server, 'list')

    const one = run(client, options, 'b')
    const two = run(client, options, 'c')
    await vi.waitFor(() => expect(order).toEqual(['start b']))

    first.resolve()
    await Promise.all([one, two])
    expect(order).toEqual(['start b', 'end b', 'start c', 'end c'])
  })

  it('leaves a query that was never loaded alone', async () => {
    const client = new QueryClient()
    await new MutationObserver(
      client,
      optimisticMutation<string, void>({
        mutationKey: ['append'],
        mutationFn: async () => {},
        patches: (item) => [patch<readonly string[]>(['absent'], (old) => [...old, item])],
        invalidates: [],
      }),
    ).mutate('b')

    expect(client.getQueryData(['absent'])).toBeUndefined()
  })
})
