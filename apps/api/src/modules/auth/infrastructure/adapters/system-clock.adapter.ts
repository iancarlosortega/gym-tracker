import type { Clock } from '@gym/domain/auth/ports/clock.port'

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}
