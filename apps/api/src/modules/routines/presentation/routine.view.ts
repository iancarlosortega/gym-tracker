import type { Routine } from '@gym/domain/routines/entities/routine.entity'
import type { RoutineEntry } from '@gym/domain/routines/entities/routine-entry.entity'

export interface RoutineEntryView {
  readonly id: string
  readonly exerciseId: string
  readonly equipmentId: string | null
  readonly position: number
  readonly targetSets: number | null
  readonly targetReps: string | null
  readonly restSeconds: number
}

export interface RoutineView {
  readonly id: string
  readonly name: string
  readonly archived: boolean
  readonly entries: readonly RoutineEntryView[]
}

export function toRoutineView(model: Routine): RoutineView {
  return {
    id: model.id.value,
    name: model.name.value,
    archived: model.isArchived,
    entries: model.entries.map(toEntryView),
  }
}

function toEntryView(entry: RoutineEntry): RoutineEntryView {
  return {
    id: entry.id.value,
    exerciseId: entry.exerciseId.value,
    equipmentId: entry.equipmentId?.value ?? null,
    position: entry.position,
    targetSets: entry.targetSets,
    // A range reads as "8-12"; an exact target reads as "8".
    targetReps: entry.targetReps?.toString() ?? null,
    restSeconds: entry.rest.value,
  }
}
