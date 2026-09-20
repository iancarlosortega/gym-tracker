import type { ScreenWakeLock } from '@gym/domain/rest-timer/ports/screen-wake-lock.port'

/**
 * The Screen Wake Lock API, with every way it can fail treated as "no".
 *
 * It is missing on older iOS, refused outside a secure context, refused when
 * the document is hidden, and dropped by the browser whenever the tab is
 * backgrounded. None of that is worth a message: the spec says the countdown
 * runs regardless and the failure is never surfaced as an error.
 */
export class NavigatorScreenWakeLock implements ScreenWakeLock {
  private sentinel: WakeLockSentinel | null = null

  async acquire(): Promise<void> {
    if (this.sentinel !== null) {
      return
    }

    try {
      this.sentinel = (await navigator.wakeLock?.request('screen')) ?? null
    } catch {
      this.sentinel = null
    }
  }

  async release(): Promise<void> {
    const held = this.sentinel
    this.sentinel = null

    try {
      await held?.release()
    } catch {
      // Already released by the browser, which is the outcome we wanted.
    }
  }
}
