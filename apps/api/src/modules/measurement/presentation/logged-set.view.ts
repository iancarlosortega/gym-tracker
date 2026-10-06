import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import type { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'

export interface LoggedSetView {
  readonly id: string
  readonly sessionId: string
  readonly exerciseId: string
  readonly equipmentId: string
  readonly mode: string
  readonly reps: number
  readonly loggedAt: string
  /** Null for STACK_POSITION: a pin position is not a mass and never becomes one. */
  readonly resolvedGrams: number | null
  readonly stackPosition: number | null
  /** The load as typed: the per-side value for PER_SIDE. Null for STACK_POSITION. */
  readonly rawGrams: number | null
  /** Bumped by every correction. */
  readonly revision: number
}

export function toLoggedSetView(model: LoggedSet): LoggedSetView {
  const state = model.entry.toJSON()
  const mass = model.mass()

  return {
    id: model.id,
    sessionId: model.sessionId,
    exerciseId: model.exerciseId,
    equipmentId: model.equipmentId,
    mode: state.mode,
    reps: model.reps,
    loggedAt: model.loggedAt.toISOString(),
    resolvedGrams: mass.kind === 'resolved' ? mass.grams : null,
    stackPosition: state.mode === 'STACK_POSITION' ? state.position : null,
    rawGrams: rawGramsOf(state),
    revision: model.revision,
  }
}

function rawGramsOf(state: ReturnType<LoadEntry['toJSON']>): number | null {
  if (state.mode === 'TOTAL') return state.grams
  if (state.mode === 'PER_SIDE') return state.perSideGrams
  return null
}
