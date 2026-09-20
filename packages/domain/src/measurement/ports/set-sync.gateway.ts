import type { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'

/**
 * The boundary the queue drains through.
 *
 * Deliberately not a repository. A repository answers "is it stored"; sync
 * needs "did the other side take responsibility for it", and those are
 * different questions. Returning the ids the server accepted — rather than
 * void, or a boolean for the batch — is what lets the queue drop exactly what
 * was received and keep the rest, which is the spec's requirement that a
 * pending set survives a failed transmission.
 */
export interface SetSyncGateway {
  /**
   * Deliver sets belonging to one session.
   *
   * Returns the ids the server confirmed. A partial acceptance is legal: the
   * caller keeps whatever is missing from the answer.
   */
  push(sessionId: string, sets: readonly LoggedSet[]): Promise<readonly string[]>
}
