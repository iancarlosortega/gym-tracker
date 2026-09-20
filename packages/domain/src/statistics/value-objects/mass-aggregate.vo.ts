import type { Grams } from '@domain/measurement/value-objects/grams.vo.js'

/**
 * A figure expressed in mass, and what it had to leave out to be honest.
 *
 * `excludedSets` travels with the answer rather than beside it, because a
 * total volume that quietly dropped three plate sets is a wrong number that
 * looks right — and the one thing a caller must not be able to do is print
 * the figure without the count.
 *
 * The not-applicable case is explicit for the same reason `MassResolution`
 * has one: a week of plate work has no tonnage, and zero is a lie about it.
 */
export type MassAggregate =
  | {
      readonly kind: 'resolved'
      readonly grams: Grams
      readonly includedSets: number
      readonly excludedSets: number
    }
  | {
      readonly kind: 'not-applicable'
      readonly reason: string
      readonly excludedSets: number
    }

export const isApplicable = (
  aggregate: MassAggregate,
): aggregate is Extract<MassAggregate, { kind: 'resolved' }> => aggregate.kind === 'resolved'
