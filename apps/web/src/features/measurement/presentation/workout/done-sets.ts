import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { LoggedSetResponse } from '../../infrastructure/session-sets.api'
import type { DoneRow } from './workout-views'

/** A set this workout has logged, wherever it currently lives. */
export interface DoneSet {
  readonly id: string
  readonly exerciseId: string
  readonly equipmentId: string
  readonly loggedAt: Date
  readonly label: string
  readonly pending: boolean
}

/** Mass as kilograms, a pin as its position: the same reading for queued and synced sets. */
const label = (grams: number | null, position: number | null, reps: number): string =>
  grams !== null ? `${grams / 1000} kg × ${reps}` : `Pin ${position ?? '?'} × ${reps}`

export const fromQueue = (set: LoggedSet): DoneSet => {
  const mass = set.mass()
  return {
    id: set.id,
    exerciseId: set.exerciseId,
    equipmentId: set.equipmentId,
    loggedAt: set.loggedAt,
    label: label(mass.kind === 'resolved' ? mass.grams : null, set.entry.position, set.reps),
    pending: true,
  }
}

export const fromServer = (set: LoggedSetResponse): DoneSet => ({
  id: set.id,
  exerciseId: set.exerciseId,
  equipmentId: set.equipmentId,
  loggedAt: new Date(set.loggedAt),
  label: label(set.resolvedGrams, set.stackPosition, set.reps),
  pending: false,
})

/** A set still in the queue has not been confirmed, whatever the server already shows. */
export const mergeDone = (server: readonly DoneSet[], queue: readonly DoneSet[]): DoneSet[] => [
  ...server.filter((set) => !queue.some((queued) => queued.id === set.id)),
  ...queue,
]

export const doneRowsFor = (exerciseId: string, sets: readonly DoneSet[]): DoneRow[] =>
  sets
    .filter((set) => set.exerciseId === exerciseId)
    .sort((left, right) => left.loggedAt.getTime() - right.loggedAt.getTime())
    .map((set, index) => ({
      id: set.id,
      setNumber: index + 1,
      label: set.label,
      pending: set.pending,
    }))
