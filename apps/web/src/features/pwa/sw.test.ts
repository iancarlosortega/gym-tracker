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
} = {}) => {
  const listeners = new Map<string, Listener>()
  const store = new Map(Object.entries(cached).map(([url, body]) => [url, response(body)]))
  const deleted: string[] = []
  const network = vi.fn(async (request: { url: string }) => {
    if (!online) throw new TypeError('offline')
    return response(`network ${request.url}`)
  })

  const context = {
    self: {
      location: { origin: 'https://app.test' },
      addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
      skipWaiting: () => undefined,
      clients: { claim: async () => undefined },
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
    // biome-ignore lint/style/useNamingConvention: the worker reads the global by its real name
    URL,
  }
  runInNewContext(readFileSync(join(process.cwd(), 'public/sw.js'), 'utf8'), context)

  const request = (url: string, { mode = 'cors', rsc = false } = {}) => {
    let answer: Promise<FakeResponse> | undefined
    listeners.get('fetch')?.({
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

  return { request, activate, network, deleted }
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

  it('drops the stale shell cache from the cache-first era', async () => {
    const worker = loadWorker({ cacheNames: ['gym-shell-v2'] })

    await worker.activate()

    expect(worker.deleted).toContain('gym-shell-v2')
  })
})
