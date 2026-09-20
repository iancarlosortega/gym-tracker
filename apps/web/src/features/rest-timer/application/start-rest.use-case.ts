import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { ScreenWakeLock } from '@gym/domain/rest-timer/ports/screen-wake-lock.port'
import { RestInterval } from '@gym/domain/rest-timer/value-objects/rest-interval.vo'
import { RestDuration } from '@gym/domain/routines/value-objects/rest-duration.vo'

export interface StartRestInput {
  /** The rest configured for the exercise just performed, in seconds. */
  readonly seconds?: number | undefined
}

/**
 * Begin resting after a set.
 *
 * The duration comes from the exercise, because the rest that matters is the
 * one the plan asked for; without one, three minutes is what most compound
 * lifts get.
 *
 * The wake lock is taken here rather than by the countdown, so the screen is
 * already awake by the first tick. A refusal is swallowed: a device that will
 * not hold the screen on is a dimmer workout, not a failure the user can act
 * on, and the countdown is unaffected either way.
 */
export class StartRestUseCase {
  constructor(
    private readonly clock: Clock,
    private readonly wakeLock: ScreenWakeLock,
  ) {}

  async execute(input: StartRestInput = {}): Promise<RestInterval> {
    const duration =
      input.seconds === undefined ? RestDuration.default() : RestDuration.create(input.seconds)

    const interval = RestInterval.start({ duration, startedAt: this.clock.now() })

    await this.wakeLock.acquire()
    return interval
  }
}
