/**
 * Keeping the screen awake, as a capability rather than a browser API.
 *
 * Both methods resolve rather than reject. A device that will not hold a wake
 * lock is a device where the screen dims during rest, which is a worse
 * workout and not an error the user can do anything about — the spec is
 * explicit that the countdown carries on and nothing is surfaced.
 */
export interface ScreenWakeLock {
  acquire(): Promise<void>
  release(): Promise<void>
}
