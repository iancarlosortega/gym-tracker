'use client'

import { useState } from 'react'
import { ListSkeleton } from '@/components/loading-skeletons'
import { QueryState } from '@/components/query-state'
import { RollbackNotice } from '@/components/rollback-notice'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import type { ExerciseResponse } from '../../../workouts/infrastructure/workouts.api'
import { EditCatalogItemForm, NewExerciseForm } from '../components/exercise-forms'
import { ExerciseList } from '../components/exercise-list'
import {
  useArchiveExercise,
  useCatalogExercises,
  useCreateExercise,
  useRenameExercise,
} from '../queries'

type Editing =
  | { readonly kind: 'new' }
  | { readonly kind: 'edit'; readonly exercise: ExerciseResponse }

export const ExercisesContainer = () => {
  const exercises = useCatalogExercises()
  const create = useCreateExercise()
  const rename = useRenameExercise()
  const archive = useArchiveExercise()
  const [editing, setEditing] = useState<Editing | null>(null)

  const close = () => {
    setEditing(null)
    create.reset()
  }

  /** Renames and archives show at once, so their sheet closes on the tap. */
  const closeAfter = (change: () => void) => {
    rename.reset()
    archive.reset()
    change()
    setEditing(null)
  }

  return (
    <>
      <QueryState
        query={exercises}
        pending={<ListSkeleton label="Loading your exercises" rows={4} />}
        failed={<p role="alert">Could not reach the server, so your exercises cannot be shown.</p>}
      >
        {(list) => (
          <ExerciseList
            exercises={list}
            onNew={() => setEditing({ kind: 'new' })}
            onEdit={(exercise) => setEditing({ kind: 'edit', exercise })}
          />
        )}
      </QueryState>
      <RollbackNotice mutation={rename} />
      <RollbackNotice mutation={archive} />

      <Drawer open={editing !== null} onOpenChange={(open) => !open && close()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {editing?.kind === 'edit' ? editing.exercise.name : 'New exercise'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {editing?.kind === 'new' && (
              <NewExerciseForm
                pending={create.isPending}
                failed={create.isError}
                onSubmit={(exercise) => create.mutate(exercise, { onSuccess: close })}
              />
            )}
            {editing?.kind === 'edit' && (
              <EditCatalogItemForm
                // A fresh form per exercise, so the name field starts from the right value.
                key={editing.exercise.id}
                name={editing.exercise.name}
                pending={false}
                failed={false}
                onRename={(name) =>
                  closeAfter(() => rename.mutate({ id: editing.exercise.id, name }))
                }
                onArchive={() => closeAfter(() => archive.mutate({ id: editing.exercise.id }))}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
