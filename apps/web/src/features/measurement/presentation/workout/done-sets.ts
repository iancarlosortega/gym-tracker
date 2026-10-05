import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { type DisplayUnit, gramsToDisplay, unitLabel } from '@/lib/units'
import type { LoggedSetResponse } from '../../infrastructure/session-sets.api'
import type { DoneRow } from './workout-views'

/** A set this workout has logged, wherever it currently lives. */
export interface DoneSet {
  readonly id: string
  readonly exerciseId: string
  readonly equipmentId: string
  readonly loggedAt: Date
  /** The resolved mass; null for a pin position, which is not a mass. */
  readonly grams: number | null
  readonly position: number | null
  readonly reps: number
  readonly pending: boolean
}

/** Mass in the user's unit, a pin as its position: the same reading for queued and synced sets. */
export const doneLabel = (set: DoneSet, unit: DisplayUnit): string =>
  set.grams !== null
    ? `${gramsToDisplay(set.grams, unit)} ${unitLabel(unit)} × ${set.reps}`
    : `Pin ${set.position ?? '?'} × ${set.reps}`

export const fromQueue = (set: LoggedSet): DoneSet => {
  const mass = set.mass()
  return {
    id: set.id,
    exerciseId: set.exerciseId,
    equipmentId: set.equipmentId,
    loggedAt: set.loggedAt,
    grams: mass.kind === 'resolved' ? mass.grams : null,
    position: set.entry.position,
    reps: set.reps,
    pending: true,
  }
}

export const fromServer = (set: LoggedSetResponse): DoneSet => ({
  id: set.id,
  exerciseId: set.exerciseId,
  equipmentId: set.equipmentId,
  loggedAt: new Date(set.loggedAt),
  grams: set.resolvedGrams,
  position: set.stackPosition,
  reps: set.reps,
  pending: false,
})

/** A set still in the queue has not been confirmed, whatever the server already shows. */
export const mergeDone = (server: readonly DoneSet[], queue: readonly DoneSet[]): DoneSet[] => [
  ...server.filter((set) => !queue.some((queued) => queued.id === set.id)),
  ...queue,
]

export const doneRowsFor = (
  exerciseId: string,
  sets: readonly DoneSet[],
  unit: DisplayUnit,
): DoneRow[] =>
  sets
    .filter((set) => set.exerciseId === exerciseId)
    .sort((left, right) => left.loggedAt.getTime() - right.loggedAt.getTime())
    .map((set, index) => ({
      id: set.id,
      setNumber: index + 1,
      label: doneLabel(set, unit),
      pending: set.pending,
    }))
