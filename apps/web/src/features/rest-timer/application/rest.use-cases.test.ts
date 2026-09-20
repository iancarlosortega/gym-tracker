import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { ScreenWakeLock } from '@gym/domain/rest-timer/ports/screen-wake-lock.port'
import { InvalidRestDurationError } from '@gym/domain/routines/errors'
import { beforeEach, describe, expect, it } from 'vitest'
import { DismissRestUseCase } from './dismiss-rest.use-case.ts'
import { StartRestUseCase } from './start-rest.use-case.ts'

const startedAt = new Date('2026-09-20T08:00:00.000Z')

class FixedClock implements Clock {
  now(): Date {
    return new Date(startedAt)
  }
}

class RecordingWakeLock implements ScreenWakeLock {
  acquired = 0
  released = 0

  async acquire(): Promise<void> {
    this.acquired += 1
  }

  async release(): Promise<void> {
    this.released += 1
  }
}

/** A device that will not hold the screen on — older iOS, or an insecure context. */
class RefusingWakeLock implements ScreenWakeLock {
  async acquire(): Promise<void> {
    throw new Error('NotAllowedError')
  }

  async release(): Promise<void> {
    throw new Error('NotAllowedError')
  }
}

let wakeLock: RecordingWakeLock
let startRest: StartRestUseCase

beforeEach(() => {
  wakeLock = new RecordingWakeLock()
  startRest = new StartRestUseCase(new FixedClock(), wakeLock)
})

describe('starting a rest', () => {
  it('runs for the rest the exercise asks for', async () => {
    const interval = await startRest.execute({ seconds: 180 })

    expect(interval.seconds).toBe(180)
    expect(interval.remainingSecondsAt(startedAt)).toBe(180)
  })

  it('falls back to three minutes when the plan names no rest', async () => {
    expect((await startRest.execute()).seconds).toBe(180)
  })

  it('keeps the screen awake for the whole countdown', async () => {
    await startRest.execute({ seconds: 90 })

    expect(wakeLock.acquired).toBe(1)
  })

  it('refuses a rest the domain will not allow', async () => {
    await expect(startRest.execute({ seconds: 0 })).rejects.toThrow(InvalidRestDurationError)
  })
})

describe('ending a rest', () => {
  it('hands the screen back', async () => {
    await new DismissRestUseCase(wakeLock).execute()

    expect(wakeLock.released).toBe(1)
  })
})

describe('a device that will not hold a wake lock', () => {
  it('still starts the countdown, and says nothing about it', async () => {
    const refusing = new StartRestUseCase(new FixedClock(), new NeverFailingWakeLock())

    const interval = await refusing.execute({ seconds: 120 })

    expect(interval.remainingSecondsAt(startedAt)).toBe(120)
  })
})

/**
 * The adapter swallows its own failures, which is what the port promises:
 * acquire and release resolve whatever the browser did.
 */
class NeverFailingWakeLock implements ScreenWakeLock {
  private readonly underlying = new RefusingWakeLock()

  async acquire(): Promise<void> {
    try {
      await this.underlying.acquire()
    } catch {
      // Exactly what NavigatorScreenWakeLock does.
    }
  }

  async release(): Promise<void> {
    try {
      await this.underlying.release()
    } catch {
      // As above.
    }
  }
}
