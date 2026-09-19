import type { Grams } from '@domain/measurement/value-objects/grams.vo.js'

/**
 * The outcome of asking a load for its mass.
 *
 * The ordinal case is modelled explicitly rather than as `null` or `0`. A
 * nullable number invites `?? 0`, and `?? 0` is exactly how a stack position
 * silently enters an average and makes a statistic wrong while looking right.
 */
export type MassResolution =
  | { readonly kind: 'resolved'; readonly grams: Grams }
  | { readonly kind: 'not-applicable'; readonly reason: string }

export function isResolved(
  resolution: MassResolution,
): resolution is { readonly kind: 'resolved'; readonly grams: Grams } {
  return resolution.kind === 'resolved'
}
