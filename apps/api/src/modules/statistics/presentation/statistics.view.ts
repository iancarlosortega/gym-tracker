import { grams, toKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import type {
  ExerciseProgression,
  ProgressionSeries,
} from '@gym/domain/statistics/services/progression.service'
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

export interface ProgressionPointView {
  readonly periodStart: string
  /** Kilograms for a mass series, the pin position for an ordinal one. */
  readonly value: number
  readonly sets: number
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
  points: series.points.map((point) => ({
    periodStart: point.periodStart.toISOString(),
    // A point in a mass series is already whole grams; an ordinal one is a
    // pin position and is never converted.
    value: series.unit === 'grams' ? toKilograms(grams(point.best)) : point.best,
    sets: point.sets,
  })),
})
