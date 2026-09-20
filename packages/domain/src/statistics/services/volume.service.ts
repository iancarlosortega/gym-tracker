import type { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import { grams } from '@domain/measurement/value-objects/grams.vo.js'
import { isResolved } from '@domain/measurement/value-objects/mass-resolution.vo.js'
import type { MassAggregate } from '@domain/statistics/value-objects/mass-aggregate.vo.js'

/**
 * Total volume: load times repetitions, summed.
 *
 * Every ordinal set is excluded and counted. A stack position is a label on a
 * pin, not a weight, so multiplying it by repetitions produces a number with
 * no unit that nonetheless adds cleanly into a tonnage — which is precisely
 * how a statistic becomes confidently wrong.
 *
 * A period with no ratio-scale sets at all answers not-applicable. Returning
 * zero would say the user moved nothing, when what happened is that they did
 * work this figure cannot describe.
 */
export const totalVolume = (sets: readonly LoggedSet[]): MassAggregate => {
  const excludedSets = sets.filter((set) => !set.countsTowardsMassAggregate()).length
  const included = sets.filter((set) => set.countsTowardsMassAggregate())

  if (included.length === 0) {
    return {
      kind: 'not-applicable',
      reason:
        sets.length === 0
          ? 'No sets were logged in this period.'
          : 'Every set in this period was measured by stack position, which has no mass.',
      excludedSets,
    }
  }

  const total = included.reduce((sum, set) => {
    const mass = set.mass()

    return isResolved(mass) ? sum + mass.grams * set.reps : sum
  }, 0)

  return { kind: 'resolved', grams: grams(total), includedSets: included.length, excludedSets }
}

/**
 * The average load lifted, ignoring how many repetitions each set had.
 *
 * Unweighted on purpose: this answers "how heavy was the work", and weighting
 * by repetitions would answer "how much work was done", which is what volume
 * is for.
 */
export const averageLoad = (sets: readonly LoggedSet[]): MassAggregate => {
  const excludedSets = sets.filter((set) => !set.countsTowardsMassAggregate()).length
  const included = sets.filter((set) => set.countsTowardsMassAggregate())

  if (included.length === 0) {
    return {
      kind: 'not-applicable',
      reason:
        sets.length === 0
          ? 'No sets were logged in this period.'
          : 'Every set in this period was measured by stack position, which has no mass.',
      excludedSets,
    }
  }

  const total = included.reduce((sum, set) => {
    const mass = set.mass()

    return isResolved(mass) ? sum + mass.grams : sum
  }, 0)

  return {
    kind: 'resolved',
    grams: grams(Math.round(total / included.length)),
    includedSets: included.length,
    excludedSets,
  }
}
