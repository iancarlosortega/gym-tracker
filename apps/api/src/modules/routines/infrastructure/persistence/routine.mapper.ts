import type { routine, routineExercise } from '@api/database/schema/routine.table.js'
import { Routine } from '@gym/domain/routines/entities/routine.entity'
import { RoutineEntry } from '@gym/domain/routines/entities/routine-entry.entity'
import { RestDuration } from '@gym/domain/routines/value-objects/rest-duration.vo'
import { RoutineName } from '@gym/domain/routines/value-objects/routine-name.vo'
import { TargetReps } from '@gym/domain/routines/value-objects/target-reps.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'

type RoutineRow = typeof routine.$inferSelect
type RoutineInsert = typeof routine.$inferInsert
type EntryRow = typeof routineExercise.$inferSelect
type EntryInsert = typeof routineExercise.$inferInsert

export const routineMapper = {
  toDomain(row: RoutineRow, entryRows: readonly EntryRow[]): Routine {
    return Routine.restore({
      id: Id.restore(row.id),
      userId: Id.restore(row.userId),
      name: RoutineName.create(row.name),
      entries: entryRows.map(entryToDomain),
      archivedOn: row.archivedAt,
      createdAt: row.createdAt,
    })
  },

  toRow(model: Routine): RoutineInsert {
    return {
      id: model.id.value,
      userId: model.userId.value,
      name: model.name.value,
      archivedAt: model.archivedOn,
      createdAt: model.createdAt,
    }
  },

  entriesToRows(model: Routine): EntryInsert[] {
    return model.entries.map((entry) => ({
      id: entry.id.value,
      routineId: model.id.value,
      exerciseId: entry.exerciseId.value,
      equipmentId: entry.equipmentId?.value ?? null,
      position: entry.position,
      targetSets: entry.targetSets,
      targetRepsMin: entry.targetReps?.minimum ?? null,
      targetRepsMax: entry.targetReps?.maximum ?? null,
      restSeconds: entry.rest.value,
    }))
  },
}

function entryToDomain(row: EntryRow): RoutineEntry {
  return RoutineEntry.restore({
    id: Id.restore(row.id),
    exerciseId: Id.restore(row.exerciseId),
    equipmentId: row.equipmentId === null ? null : Id.restore(row.equipmentId),
    position: row.position,
    targetSets: row.targetSets,
    targetReps:
      row.targetRepsMin === null
        ? null
        : TargetReps.create(row.targetRepsMin, row.targetRepsMax ?? row.targetRepsMin),
    rest: RestDuration.create(row.restSeconds),
  })
}
