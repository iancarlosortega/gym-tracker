/**
 * The device could not store a set.
 *
 * This is the one failure the spec says must never be silent: browser storage
 * can be full, evicted, or blocked outright in private mode, and a set that
 * was neither stored nor sent is a set the user performed and the application
 * has lost. It stays a client error rather than a domain one — the domain has
 * no opinion about IndexedDB quotas.
 */
export class QueueWriteFailedError extends Error {
  constructor(cause: unknown) {
    super('That set could not be saved on this device. Check your storage and log it again.', {
      cause,
    })
    this.name = 'QueueWriteFailedError'
  }
}
