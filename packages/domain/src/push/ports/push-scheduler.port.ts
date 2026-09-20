import type { ScheduledPush } from '@domain/push/entities/scheduled-push.entity.js'

/**
 * Where rest alerts wait for their moment.
 *
 * `claimDue` is the whole reason this is not an ordinary repository: it must
 * hand a row to exactly one caller, so two API processes ticking at the same
 * second cannot both send the same buzz. The adapter takes that lock; the
 * port only promises the guarantee.
 */
export interface PushScheduler {
  schedule(push: ScheduledPush): Promise<void>

  /** Cancelling is by set, because that is what the user dismissed. */
  cancelForSet(setId: string): Promise<void>

  /**
   * Take ownership of every alert now due, exclusively.
   *
   * A row returned here is this caller's to send, and no other caller will be
   * handed it.
   */
  claimDue(instant: Date, limit: number): Promise<readonly ScheduledPush[]>

  markSent(push: ScheduledPush): Promise<void>
}
