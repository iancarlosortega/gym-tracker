import type { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'

/** The sets of one exercise in the session it was last done in. */
export interface LastSession {
  readonly sessionStartedAt: Date
  /** In the order they were logged. */
  readonly sets: readonly LoggedSet[]
}

/**
 * Reads what was done last time, scoped to the user.
 *
 * The session being logged is excluded, so "last time" never echoes the sets
 * the user has just entered.
 */
export interface LastSetsRepository {
  lastSession(
    userId: string,
    exerciseId: string,
    excludingSessionId: string | null,
  ): Promise<LastSession | null>
}
