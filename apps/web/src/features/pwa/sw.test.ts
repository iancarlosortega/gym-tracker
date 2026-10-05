import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

type Listener = (event: unknown) => void

interface FakeResponse {
  readonly ok: boolean
  readonly body: string
  clone(): FakeResponse
}

const response = (body: string): FakeResponse => ({ ok: true, body, clone: () => response(body) })

/** Loads public/sw.js the way a browser would, against a fake cache and network. */
const loadWorker = ({
  cached = {} as Record<string, string>,
  cacheNames = [] as string[],
  online = true,
  /** A network that answers only when the test says so. */
  slow = false,
} = {}) => {
  const listeners = new Map<string, Listener>()
  const store = new Map(Object.entries(cached).map(([url, body]) => [url, response(body)]))
  const deleted: string[] = []
  const late: (() => void)[] = []
  const network = vi.fn(async (request: { url: string }) => {
    if (!online) throw new TypeError('offline')
    if (slow) await new Promise<void>((resolve) => late.push(resolve))
    return response(`network ${request.url}`)
  })
  const preload = { enabled: false }

  const context = {
    self: {
      location: { origin: 'https://app.test' },
      addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
      skipWaiting: () => undefined,
      clients: { claim: async () => undefined },
      registration: {
        navigationPreload: {
          enable: async () => {
            preload.enabled = true
          },
        },
      },
    },
    caches: {
      match: async (request: { url: string }) => store.get(request.url),
      open: async () => ({
        put: async (request: { url: string }, value: FakeResponse) => store.set(request.url, value),
        addAll: async () => undefined,
      }),
      keys: async () => cacheNames,
      delete: async (name: string) => deleted.push(name),
    },
    fetch: network,
    // The worker's timers run on the test's clock, fake or real.
    setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
    clearTimeout: (handle: ReturnType<typeof setTimeout>) => clearTimeout(handle),
    // biome-ignore lint/style/useNamingConvention: the worker reads the global by its real name
    URL,
  }
  runInNewContext(readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8'), context)

  const pending: Promise<unknown>[] = []
  const request = (
    url: string,
    {
      mode = 'cors',
      rsc = false,
      preloadResponse = undefined as Promise<FakeResponse | undefined> | undefined,
    } = {},
  ) => {
    let answer: Promise<FakeResponse> | undefined
    listeners.get('fetch')?.({
      preloadResponse,
      waitUntil: (value: Promise<unknown>) => pending.push(value),
      request: {
        method: 'GET',
        url,
        mode,
        headers: new Headers(rsc ? [['RSC', '1']] : []),
      },
      respondWith: (value: Promise<FakeResponse>) => {
        answer = value
      },
    })
    return answer
  }

  const activate = async () => {
    let done: Promise<unknown> | undefined
    listeners.get('activate')?.({ waitUntil: (value: Promise<unknown>) => (done = value) })
    await done
  }

  /** Let every late network answer arrive, and the cache writes it started. */
  const answerLate = async () => {
    for (const resolve of late.splice(0)) resolve()
    await Promise.all(pending)
  }

  return { request, activate, network, deleted, preload, answerLate, store }
}

describe('the service worker', () => {
  it('opens a page from the network, so a new build reaches the phone', async () => {
    const worker = loadWorker({ cached: { 'https://app.test/profile': 'old profile' } })

    const page = await worker.request('https://app.test/profile', { mode: 'navigate' })

    expect(page?.body).toBe('network https://app.test/profile')
  })

  it('falls back to the cached page with no network', async () => {
    const worker = loadWorker({ cached: { 'https://app.test/': 'cached home' }, online: false })

    const page = await worker.request('https://app.test/', { mode: 'navigate' })

    expect(page?.body).toBe('cached home')
  })

  it('reads page data (RSC) from the network first as well', async () => {
    const worker = loadWorker({ cached: { 'https://app.test/profile?_rsc=1': 'old data' } })

    const data = await worker.request('https://app.test/profile?_rsc=1', { rsc: true })

    expect(data?.body).toBe('network https://app.test/profile?_rsc=1')
  })

  it('serves content-hashed scripts from the cache, since they never change', async () => {
    const chunk = 'https://app.test/_next/static/chunks/app-3f2a.js'
    const worker = loadWorker({ cached: { [chunk]: 'cached chunk' } })

    const script = await worker.request(chunk)

    expect(script?.body).toBe('cached chunk')
    expect(worker.network).not.toHaveBeenCalled()
  })

  it('drops the older shell caches when a new build activates', async () => {
    const worker = loadWorker({ cacheNames: ['gym-shell-v2', 'gym-shell-v3'] })

    await worker.activate()

    expect(worker.deleted).toEqual(['gym-shell-v2', 'gym-shell-v3'])
  })

  it('leaves API reads to the browser, so they never wait on the worker', () => {
    const worker = loadWorker()

    expect(worker.request('https://api.test/routines?limit=200')).toBeUndefined()
    expect(worker.network).not.toHaveBeenCalled()
  })

  it('turns on navigation preload when it activates', async () => {
    const worker = loadWorker()

    await worker.activate()

    expect(worker.preload.enabled).toBe(true)
  })

  it('opens a navigation from the preloaded answer instead of fetching again', async () => {
    const worker = loadWorker()

    const page = await worker.request('https://app.test/routines', {
      mode: 'navigate',
      preloadResponse: Promise.resolve(response('preloaded routines')),
    })

    expect(page?.body).toBe('preloaded routines')
    expect(worker.network).not.toHaveBeenCalled()
  })

  describe('on a network too slow to answer', () => {
    it('shows the last copy after the time limit, then stores the fresh one', async () => {
      vi.useFakeTimers()
      try {
        const worker = loadWorker({
          cached: { 'https://app.test/routines': 'cached routines' },
          slow: true,
        })

        const page = worker.request('https://app.test/routines', { mode: 'navigate' })
        await vi.advanceTimersByTimeAsync(3000)

        expect((await page)?.body).toBe('cached routines')
        await worker.answerLate()
        expect(worker.store.get('https://app.test/routines')?.body).toBe(
          'network https://app.test/routines',
        )
      } finally {
        vi.useRealTimers()
      }
    })

    it('keeps waiting for the network when there is no copy to show', async () => {
      vi.useFakeTimers()
      try {
        const worker = loadWorker({ slow: true })

        const page = worker.request('https://app.test/routines', { mode: 'navigate' })
        await vi.advanceTimersByTimeAsync(3000)
        await worker.answerLate()

        expect((await page)?.body).toBe('network https://app.test/routines')
      } finally {
        vi.useRealTimers()
      }
    })
  })
})
