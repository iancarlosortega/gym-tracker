import type { Exercise } from '@gym/domain/catalog/entities/exercise.entity'

/**
 * What an exercise looks like over the wire.
 *
 * Entities are never serialised directly: a getter added for the domain's
 * benefit would otherwise silently become part of the public API.
 */
export interface ExerciseView {
  readonly id: string
  readonly name: string
  readonly defaultMode: string
  readonly archived: boolean
  readonly createdAt: string
}

export function toExerciseView(model: Exercise): ExerciseView {
  return {
    id: model.id.value,
    name: model.name.value,
    defaultMode: model.defaultMode,
    archived: model.isArchived,
    createdAt: model.createdAt.toISOString(),
  }
}
