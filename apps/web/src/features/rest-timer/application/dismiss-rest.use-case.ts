import type { ScreenWakeLock } from '@gym/domain/rest-timer/ports/screen-wake-lock.port'

/**
 * End a rest, whether it ran out or the user skipped it.
 *
 * One use case for both, because the difference is only whether an alert was
 * earned — and the screen has to be handed back either way. A rest that ended
 * while still holding the wake lock would keep the phone awake in a pocket
 * for the rest of the session.
 */
export class DismissRestUseCase {
  constructor(private readonly wakeLock: ScreenWakeLock) {}

  async execute(): Promise<void> {
    await this.wakeLock.release()
  }
}
