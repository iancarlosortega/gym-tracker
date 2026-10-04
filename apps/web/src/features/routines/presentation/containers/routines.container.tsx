'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { QueryState } from '@/components/query-state'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { EditCatalogItemForm } from '../../../catalog/presentation/components/exercise-forms'
import { useCatalogExercises } from '../../../catalog/presentation/queries'
import { useStartWorkout } from '../../../workouts/presentation/queries'
import { NewRoutineForm } from '../components/new-routine-form'
import { RoutineCards, RoutinePlan } from '../components/routine-views'
import {
  useArchiveRoutine,
  useCreateRoutine,
  useRenameRoutine,
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
        pending={<p>Reading your routines…</p>}
        failed={<p role="alert">Could not reach the server, so your routines cannot be shown.</p>}
      >
        {(list) => (
          <RoutineCards
            routines={list}
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

export const RoutinePlanContainer = ({ routineId }: { readonly routineId: string }) => {
  const router = useRouter()
  const routine = useRoutine(routineId)
  const exerciseNames = useExerciseNames()
  const start = useStartWorkout()
  const rename = useRenameRoutine()
  const archive = useArchiveRoutine()
  const [editing, setEditing] = useState(false)

  const close = () => {
    setEditing(false)
    rename.reset()
    archive.reset()
  }

  return (
    <QueryState
      query={routine}
      pending={<p>Reading this routine…</p>}
      failed={<p role="alert">Could not reach the server, so this routine cannot be shown.</p>}
    >
      {(plan) => (
        <>
          <RoutinePlan
            routine={plan}
            exerciseNames={exerciseNames}
            starting={start.isPending}
            startFailed={start.isError}
            onStart={() => start.mutate(plan.id, { onSuccess: () => router.push('/workout') })}
            onEdit={() => setEditing(true)}
          />

          <Drawer open={editing} onOpenChange={(open) => !open && close()}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{plan.name}</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6">
                <EditCatalogItemForm
                  name={plan.name}
                  pending={rename.isPending || archive.isPending}
                  failed={rename.isError || archive.isError}
                  onRename={(name) => rename.mutate({ id: plan.id, name }, { onSuccess: close })}
                  onArchive={() =>
                    archive.mutate(plan.id, { onSuccess: () => router.push('/routines') })
                  }
                />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </QueryState>
  )
}
