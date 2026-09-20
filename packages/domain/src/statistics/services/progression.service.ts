import type { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import type { MeasurementMode } from '@domain/measurement/value-objects/load-entry.vo.js'
import { isResolved } from '@domain/measurement/value-objects/mass-resolution.vo.js'

export interface ProgressionPoint {
  /** The first instant of the period this point covers. */
  readonly periodStart: Date
  /** Grams for a ratio mode, a stack position for an ordinal one. */
  readonly best: number
  readonly sets: number
}

/**
 * One exercise's progression, in one measurement mode.
 *
 * A series never spans two modes. The unit is part of what the numbers mean,
 * and a chart whose y-axis silently changes from kilograms to pin positions
 * is not a trend — it is two different questions drawn as one line.
 */
export interface ProgressionSeries {
  readonly exerciseId: string
  readonly mode: MeasurementMode
  /** What the numbers are: mass in grams, or an ordinal position. */
  readonly unit: 'grams' | 'position'
  readonly points: readonly ProgressionPoint[]
}

export interface ExerciseProgression {
  readonly exerciseId: string
  /** One per mode the exercise was logged in, oldest first. */
  readonly series: readonly ProgressionSeries[]
  /**
   * Set when the exercise changed how it is measured.
   *
   * The spec requires reporting this rather than drawing through it: the
   * numbers before and after are not comparable, and a continuous line would
   * claim they are.
   */
  readonly modeChanges: readonly ModeChange[]
}

export interface ModeChange {
  readonly at: Date
  readonly from: MeasurementMode
  readonly to: MeasurementMode
}

/** Monday, so a week is the week a lifter thinks in rather than a rolling seven days. */
export const startOfWeek = (instant: Date): Date => {
  const start = new Date(
    Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate()),
  )
  const weekday = (start.getUTCDay() + 6) % 7

  start.setUTCDate(start.getUTCDate() - weekday)
  return start
}

/**
 * Build one exercise's progression from its sets.
 *
 * The best set of each week represents that week: an average would be pulled
 * down by warm-ups, and progression is a question about the top of the effort
 * rather than the middle of it.
 */
export const progression = (
  exerciseId: string,
  sets: readonly LoggedSet[],
): ExerciseProgression => {
  const ordered = [...sets]
    .filter((set) => set.exerciseId === exerciseId)
    .sort((left, right) => left.loggedAt.getTime() - right.loggedAt.getTime())

  const byMode = new Map<MeasurementMode, LoggedSet[]>()

  for (const set of ordered) {
    const mode = set.entry.toJSON().mode
    const existing = byMode.get(mode)

    if (existing === undefined) {
      byMode.set(mode, [set])
    } else {
      existing.push(set)
    }
  }

  return {
    exerciseId,
    series: [...byMode].map(([mode, modeSets]) => toSeries(exerciseId, mode, modeSets)),
    modeChanges: changesBetweenModes(ordered),
  }
}

const toSeries = (
  exerciseId: string,
  mode: MeasurementMode,
  sets: readonly LoggedSet[],
): ProgressionSeries => {
  const weeks = new Map<number, LoggedSet[]>()

  for (const set of sets) {
    const week = startOfWeek(set.loggedAt).getTime()
    const existing = weeks.get(week)

    if (existing === undefined) {
      weeks.set(week, [set])
    } else {
      existing.push(set)
    }
  }

  const points = [...weeks]
    .sort(([left], [right]) => left - right)
    .map(([week, weekSets]) => ({
      periodStart: new Date(week),
      best: Math.max(...weekSets.map(valueOf)),
      sets: weekSets.length,
    }))

  return { exerciseId, mode, unit: mode === 'STACK_POSITION' ? 'position' : 'grams', points }
}

/** A set's number, in whatever scale its mode uses. */
const valueOf = (set: LoggedSet): number => {
  const mass = set.mass()

  if (isResolved(mass)) {
    return mass.grams
  }

  const state = set.entry.toJSON()
  return state.mode === 'STACK_POSITION' ? state.position : 0
}

const changesBetweenModes = (ordered: readonly LoggedSet[]): ModeChange[] => {
  const changes: ModeChange[] = []

  for (const [index, set] of ordered.entries()) {
    const previous = ordered[index - 1]

    if (previous === undefined) {
      continue
    }

    const from = previous.entry.toJSON().mode
    const to = set.entry.toJSON().mode

    if (from !== to) {
      changes.push({ at: set.loggedAt, from, to })
    }
  }

  return changes
}
