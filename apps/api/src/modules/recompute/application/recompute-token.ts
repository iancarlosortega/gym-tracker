import { createHash } from 'node:crypto'
import type { SetChange } from '@gym/domain/recompute/value-objects/recompute-diff.vo'

/**
 * A fingerprint of exactly the diff that was shown.
 *
 * Hashed rather than stored: there is no row to expire, clean up, or leak,
 * and a confirmation either describes the diff we just derived or it does
 * not. Every field that appears on screen goes in, so a set whose value
 * changed between preview and confirmation produces a different token and is
 * refused rather than applied unseen.
 */
export const tokenFor = (equipmentId: string, changes: readonly SetChange[]): string => {
  const canonical = [...changes]
    .sort((left, right) => left.setId.localeCompare(right.setId))
    .map((change) => `${change.setId}:${change.currentGrams}:${change.recomputedGrams}`)
    .join('|')

  return createHash('sha256').update(`${equipmentId}\n${canonical}`).digest('hex')
}
