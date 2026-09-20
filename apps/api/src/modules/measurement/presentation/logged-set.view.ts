import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'

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
  }
}
