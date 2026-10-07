/**
 * The application shell, cached by hand.
 *
 * Four rules:
 *
 *  - pages and their data are network-first, refreshing the cache as they go,
 *    so a new build reaches the phone the next time it is online, and the last
 *    copy still opens the app with no network at all;
 *  - a network that has not answered within a few seconds loses to that last
 *    copy, so a weak signal at the gym does not freeze every tap; the late
 *    answer still lands in the cache for next time;
 *  - content-hashed assets (`/_next/static`) are cache-first: their URL changes
 *    whenever their bytes do, so a cached copy can never be stale;
 *  - anything on another origin, the API included, and anything that is not a
 *    plain read is left to the browser. The worker never cached API reads, so
 *    handling them only added its start-up time to every request; and the sync
 *    queue's POSTs are application state, not a cache concern.
 *
 * v4 drops the v3 cache along with every older one.
 */

const SHELL_CACHE = 'gym-shell-v7'
const SHELL = ['/', '/workout', '/manifest.webmanifest', '/icon.svg', '/apple-touch-icon.png']

/** How long a navigation waits on the network before the last copy is shown. */
const NETWORK_TIMEOUT_MS = 3000

/** Immutable by construction: the build names them after their contents. */
const isHashedAsset = (url) => url.pathname.startsWith('/_next/static/')

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // The page request starts while the worker is still waking up.
      self.registration.navigationPreload?.enable(),
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names.filter((name) => name !== SHELL_CACHE).map((name) => caches.delete(name)),
          ),
        ),
    ]).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  // Anything that is not a plain read belongs to the application, including
  // every set on its way to the server. Let it through untouched.
  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  // The API and anything else off-site: the browser fetches it directly.
  if (url.origin !== self.location.origin) {
    return
  }

  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(networkFirst(event))
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached !== undefined) {
    return cached
  }

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(SHELL_CACHE)
    cache.put(request, response.clone())
  }
  return response
}

/** Keep a good answer for the next time there is none. */
async function keep(request, response) {
  if (response.ok) {
    const cache = await caches.open(SHELL_CACHE)
    await cache.put(request, response.clone())
  }
  return response
}

/**
 * The network's answer when it comes in time, the last copy when it does not.
 *
 * With no copy to fall back on there is nothing better to show, so the page
 * keeps waiting for the network. Either way the network's answer, early or
 * late, refreshes the cache.
 */
async function networkFirst(event) {
  const request = event.request
  const fromNetwork = Promise.resolve(event.preloadResponse)
    .then((preloaded) => preloaded ?? fetch(request))
    .then((response) => keep(request, response))
  event.waitUntil(fromNetwork.catch(() => undefined))

  let timer
  const lastCopyWhenLate = new Promise((resolve) => {
    timer = setTimeout(() => resolve(caches.match(request)), NETWORK_TIMEOUT_MS)
  })

  try {
    const first = await Promise.race([fromNetwork, lastCopyWhenLate])
    return first ?? (await fromNetwork)
  } catch (failure) {
    const cached = await caches.match(request)
    if (cached !== undefined) {
      return cached
    }
    throw failure
  } finally {
    clearTimeout(timer)
  }
}

/**
 * A rest alert arriving with the app closed.
 *
 * Every push carries a notification: the browsers that deliver push all
 * require `userVisibleOnly`, and a push that showed nothing would eventually
 * cost us the permission entirely.
 */
self.addEventListener('push', (event) => {
  const payload = readPayload(event)

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      // Notification centres want a bitmap; an SVG shows as a blank square on some phones.
      icon: '/icon-192.png',
      badge: '/icon.svg',
      // The phone is in a pocket; the buzz is the whole point.
      vibrate: [120, 80, 120],
      tag: 'rest-over',
      renotify: true,
    }),
  )
})

/** Tapping the alert returns to the workout rather than opening a new copy. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((client) => client.url.includes('/workout'))

      return open === undefined ? self.clients.openWindow('/workout') : open.focus()
    }),
  )
})

function readPayload(event) {
  try {
    return event.data?.json() ?? { title: 'Rest is over', body: 'Time for your next set.' }
  } catch {
    return { title: 'Rest is over', body: 'Time for your next set.' }
  }
}
