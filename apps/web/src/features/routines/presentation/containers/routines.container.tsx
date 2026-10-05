'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ListSkeleton, PlanSkeleton } from '@/components/loading-skeletons'
import { QueryState } from '@/components/query-state'
import { RollbackNotice } from '@/components/rollback-notice'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { EditCatalogItemForm } from '../../../catalog/presentation/components/exercise-forms'
import { useCatalogExercises } from '../../../catalog/presentation/queries'
import { useStartWorkout } from '../../../workouts/presentation/queries'
import type { RoutineEntryResponse } from '../../infrastructure/routines.api'
import { EntryEditor } from '../components/entry-editor'
import { NewRoutineForm } from '../components/new-routine-form'
import { addedEntry, RoutineEditor } from '../components/routine-editor'
import { RoutineCards, RoutinePlan } from '../components/routine-views'
import {
  useAddRoutineExercise,
  useArchiveRoutine,
  useChangeRoutineEntry,
  useCreateRoutine,
  useRemoveRoutineEntry,
  useRenameRoutine,
  useReorderRoutine,
  useRoutine,
  useRoutines,
} from '../queries'

/** Archived exercises included: a routine may still name one. */
const useExerciseNames = (): ReadonlyMap<string, string> => {
  const exercises = useCatalogExercises().data

  return useMemo(
    () => new Map((exercises ?? []).map((exercise) => [exercise.id, exercise.name])),
    [exercises],
  )
}

export const RoutinesContainer = () => {
  const router = useRouter()
  const routines = useRoutines()
  const exerciseNames = useExerciseNames()
  const create = useCreateRoutine()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <QueryState
        query={routines}
        pending={<ListSkeleton label="Loading your routines" />}
        failed={<p role="alert">Could not reach the server, so your routines cannot be shown.</p>}
      >
        {(listing) => (
          <RoutineCards
            routines={listing.routines}
            upNextId={listing.upNextRoutineId}
            exerciseNames={exerciseNames}
            onNew={() => setCreating(true)}
          />
        )}
      </QueryState>

      <Drawer
        open={creating}
        onOpenChange={(open) => {
          setCreating(open)
          create.reset()
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>New routine</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <NewRoutineForm
              pending={create.isPending}
              failed={create.isError}
              onSubmit={(name) =>
                create.mutate(name, {
                  onSuccess: (routine) => router.push(`/routines/${routine.id}`),
                })
              }
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

type Sheet =
  | { readonly kind: 'rename' }
  | { readonly kind: 'entry'; readonly entry: RoutineEntryResponse }

export const RoutinePlanContainer = ({ routineId }: { readonly routineId: string }) => {
  const router = useRouter()
  const routine = useRoutine(routineId)
  const exerciseNames = useExerciseNames()
  const catalog = useCatalogExercises().data ?? []
  const start = useStartWorkout()
  const rename = useRenameRoutine()
  const archive = useArchiveRoutine()
  const add = useAddRoutineExercise(routineId)
  const change = useChangeRoutineEntry(routineId)
  const remove = useRemoveRoutineEntry(routineId)
  const reorder = useReorderRoutine(routineId)
  const [editing, setEditing] = useState(false)
  const [sheet, setSheet] = useState<Sheet | null>(null)

  const close = () => {
    setSheet(null)
    archive.reset()
  }

  /** Edits show at once, so their sheet closes on the tap. */
  const closeAfter = (edit: () => void) => {
    for (const mutation of [rename, change, remove]) mutation.reset()
    edit()
    setSheet(null)
  }

  return (
    <QueryState
      query={routine}
      pending={<PlanSkeleton />}
      failed={<p role="alert">Could not reach the server, so this routine cannot be shown.</p>}
    >
      {(plan) => (
        <>
          {editing ? (
            <RoutineEditor
              routine={plan}
              exerciseNames={exerciseNames}
              exercises={catalog}
              pending={add.isPending}
              onReorder={(entryIds) => reorder.mutate(entryIds)}
              onEditEntry={(entry) => setSheet({ kind: 'entry', entry })}
              onAdd={(exerciseId) =>
                add.mutate(exerciseId, {
                  // Straight to its targets: an exercise with none is only half added.
                  onSuccess: (updated) => {
                    const created = addedEntry(plan, updated)
                    if (created !== null) setSheet({ kind: 'entry', entry: created })
                  },
                })
              }
              onRename={() => setSheet({ kind: 'rename' })}
              onDone={() => setEditing(false)}
            />
          ) : (
            <RoutinePlan
              routine={plan}
              exerciseNames={exerciseNames}
              starting={start.isPending}
              startFailed={start.isError}
              onStart={() => start.mutate(plan.id, { onSuccess: () => router.push('/workout') })}
              onEdit={() => setEditing(true)}
            />
          )}

          {add.isError && (
            <p role="alert" className="text-destructive text-sm">
              Couldn't reach the server, so that change was not saved.
            </p>
          )}
          <RollbackNotice mutation={rename} />
          <RollbackNotice mutation={reorder} />
          <RollbackNotice mutation={change} />
          <RollbackNotice mutation={remove} />

          <Drawer open={sheet !== null} onOpenChange={(open) => !open && close()}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>
                  {sheet?.kind === 'entry'
                    ? (exerciseNames.get(sheet.entry.exerciseId) ?? 'Exercise')
                    : plan.name}
                </DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6">
                {sheet?.kind === 'entry' && (
                  <EntryEditor
                    key={sheet.entry.id}
                    entry={sheet.entry}
                    pending={false}
                    failed={false}
                    onSave={(targets) =>
                      closeAfter(() => change.mutate({ entryId: sheet.entry.id, targets }))
                    }
                    onRemove={() => closeAfter(() => remove.mutate(sheet.entry.id))}
                  />
                )}
                {sheet?.kind === 'rename' && (
                  <EditCatalogItemForm
                    name={plan.name}
                    pending={archive.isPending}
                    failed={archive.isError}
                    onRename={(name) => closeAfter(() => rename.mutate({ id: plan.id, name }))}
                    onArchive={() =>
                      archive.mutate(plan.id, { onSuccess: () => router.push('/routines') })
                    }
                  />
                )}
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </QueryState>
  )
}
