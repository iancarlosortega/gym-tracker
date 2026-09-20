import type { Clock } from '@gym/domain/auth/ports/clock.port'

/** The device's clock. The same port the server implements, on this side. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}
