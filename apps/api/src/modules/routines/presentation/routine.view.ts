import { type PageView, toPageView } from '@api/common/http/page.view.js'
import type { RoutineListing } from '@api/modules/routines/application/use-cases/list-routines.use-case.js'
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
  /** The user's routine order; zero is first. */
  readonly position: number
  readonly archived: boolean
  readonly entries: readonly RoutineEntryView[]
}

export function toRoutineView(model: Routine): RoutineView {
  return {
    id: model.id.value,
    name: model.name.value,
    position: model.position,
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

/** A routine as the list shows it: with when it was last done. */
export interface ListedRoutineView extends RoutineView {
  readonly lastDoneAt: string | null
}

export interface RoutineListView extends PageView<ListedRoutineView> {
  readonly upNextRoutineId: string | null
}

export function toRoutineListView(listing: RoutineListing): RoutineListView {
  return {
    ...toPageView(listing.page),
    items: listing.page.items.map((routine) => ({
      ...toRoutineView(routine),
      lastDoneAt: listing.lastDoneAt.get(routine.id.value)?.toISOString() ?? null,
    })),
    upNextRoutineId: listing.upNextRoutineId,
  }
}
