import type { Grams } from '@domain/measurement/value-objects/grams.vo.js'

/**
 * What one set would become, and what it is now.
 *
 * Both sides are kept because the preview has to show the user the change
 * rather than the result: "sixty becomes sixty-five" is a decision they can
 * make, and "sixty-five" alone is one they have already been handed.
 */
export interface SetChange {
  readonly setId: string
  readonly exerciseId: string
  readonly loggedAt: Date
  readonly currentGrams: Grams
  readonly recomputedGrams: Grams
}

export interface PersonalRecordChange {
  readonly exerciseId: string
  readonly currentGrams: Grams
  readonly recomputedGrams: Grams
  /** The set that holds the record afterwards; it may be a different one. */
  readonly holderSetId: string
}

export interface RecomputeDiff {
  readonly equipmentId: string
  readonly changes: readonly SetChange[]
  readonly records: readonly PersonalRecordChange[]
  /**
   * Binds a confirmation to exactly this diff.
   *
   * Without it, a preview shown and confirmed minutes later could apply a
   * change the user never saw — a set logged in between would ride along
   * unreviewed. A mismatch forces a fresh preview rather than guessing which
   * of the two the user meant.
   */
  readonly token: string
}

export const affectedSetCount = (diff: RecomputeDiff): number => diff.changes.length
