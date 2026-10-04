import { grams, toKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import {
  type ExerciseProgression,
  type ProgressionSeries,
  type WeekOverWeek,
  weekOverWeek,
} from '@gym/domain/statistics/services/progression.service'
import type { WeekSummary } from '@gym/domain/statistics/services/week-summary.service'
import type { MassAggregate } from '@gym/domain/statistics/value-objects/mass-aggregate.vo'

/**
 * A mass figure on the wire, with its exclusions attached.
 *
 * `kilograms` is null rather than absent when the figure does not apply, and
 * `excludedSets` is always present. A client cannot render the number without
 * also being handed the reason it might be incomplete — which is the spec's
 * disclosure requirement expressed as a type.
 */
export interface MassAggregateView {
  readonly applicable: boolean
  readonly kilograms: number | null
  readonly reason: string | null
  readonly includedSets: number
  readonly excludedSets: number
}

export const toMassAggregateView = (aggregate: MassAggregate): MassAggregateView =>
  aggregate.kind === 'resolved'
    ? {
        applicable: true,
        kilograms: toKilograms(aggregate.grams),
        reason: null,
        includedSets: aggregate.includedSets,
        excludedSets: aggregate.excludedSets,
      }
    : {
        applicable: false,
        kilograms: null,
        reason: aggregate.reason,
        includedSets: 0,
        excludedSets: aggregate.excludedSets,
      }

export interface WeekSummaryView {
  readonly sets: number
  readonly workouts: number
  /** Null when no session that week followed a routine; there was no plan. */
  readonly plan: { readonly plannedSets: number; readonly completedSets: number } | null
  readonly liftsUp: number
  readonly liftsHeld: number
  readonly liftsDown: number
}

export interface WeekComparisonView {
  readonly current: WeekSummaryView
  readonly previous: WeekSummaryView
  /** ISO dates of this week's workouts. */
  readonly trainedOn: readonly string[]
}

export const toWeekComparisonView = (comparison: {
  readonly current: WeekSummary
  readonly previous: WeekSummary
  readonly trainedOn: readonly string[]
}): WeekComparisonView => ({
  current: toWeekSummaryView(comparison.current),
  previous: toWeekSummaryView(comparison.previous),
  trainedOn: comparison.trainedOn,
})

const toWeekSummaryView = (summary: WeekSummary): WeekSummaryView => ({
  sets: summary.sets,
  workouts: summary.workouts,
  plan: summary.plan,
  liftsUp: summary.movements.filter((movement) => movement.direction === 'up').length,
  liftsHeld: summary.movements.filter((movement) => movement.direction === 'held').length,
  liftsDown: summary.movements.filter((movement) => movement.direction === 'down').length,
})

export interface ProgressionPointView {
  readonly periodStart: string
  /** Kilograms for a mass series, the pin position for an ordinal one. */
  readonly value: number
  /** The repetitions of the set that value came from. */
  readonly reps: number
  readonly sets: number
  /** How this week compares to the one before it, in either dimension. */
  readonly change: 'improved-load' | 'improved-reps' | 'held' | 'declined'
}

export interface ProgressionSeriesView {
  readonly mode: string
  readonly unit: 'kilograms' | 'position'
  readonly points: readonly ProgressionPointView[]
}

export interface ExerciseProgressionView {
  readonly exerciseId: string
  readonly series: readonly ProgressionSeriesView[]
  readonly modeChanges: readonly {
    readonly at: string
    readonly from: string
    readonly to: string
  }[]
}

export const toExerciseProgressionView = (model: ExerciseProgression): ExerciseProgressionView => ({
  exerciseId: model.exerciseId,
  series: model.series.map(toSeriesView),
  modeChanges: model.modeChanges.map((change) => ({
    at: change.at.toISOString(),
    from: change.from,
    to: change.to,
  })),
})

/** Grams are the domain's unit; kilograms are what a client shows. A position is neither. */
const toSeriesView = (series: ProgressionSeries): ProgressionSeriesView => ({
  mode: series.mode,
  unit: series.unit === 'grams' ? 'kilograms' : 'position',
  points: series.points.map((point, index) => ({
    periodStart: point.periodStart.toISOString(),
    // A point in a mass series is already whole grams; an ordinal one is a
    // pin position and is never converted.
    value: series.unit === 'grams' ? toKilograms(grams(point.best)) : point.best,
    reps: point.reps,
    sets: point.sets,
    // Compared only within this series, so the two points are on one scale.
    change: toChange(weekOverWeek(series.points[index - 1], point)),
  })),
})

const toChange = (comparison: WeekOverWeek): ProgressionPointView['change'] => {
  switch (comparison.kind) {
    case 'improved':
      return comparison.by === 'load' ? 'improved-load' : 'improved-reps'
    case 'declined':
      return 'declined'
    default:
      return 'held'
  }
}
