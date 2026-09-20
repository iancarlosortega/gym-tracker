/**
 * The application shell, cached by hand.
 *
 * Two rules, and the second one is the important one:
 *
 *  - the shell is precached so the app opens with no network at all;
 *  - API requests are network-first, because a stale set list is worse than
 *    a missing one;
 *  - the sync queue is never touched. Those POSTs are application state, not
 *    a cache concern, and a service worker that replayed or swallowed one
 *    would be inventing sets nobody performed.
 */

const SHELL_CACHE = 'gym-shell-v2'
const SHELL = ['/', '/workout', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== SHELL_CACHE).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
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

  if (url.origin !== self.location.origin) {
    event.respondWith(networkFirst(request))
    return
  }

  event.respondWith(cacheFirst(request))
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

async function networkFirst(request) {
  try {
    return await fetch(request)
  } catch (failure) {
    const cached = await caches.match(request)
    if (cached !== undefined) {
      return cached
    }
    throw failure
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
      icon: '/icon.svg',
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
