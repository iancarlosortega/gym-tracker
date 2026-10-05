'use client'

import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ExerciseResponse } from '../../../workouts/infrastructure/workouts.api'
import type { RoutineEntryResponse, RoutineResponse } from '../../infrastructure/routines.api'
import { restLabel, targetLabel } from './routine-views'
import { SortableList } from './sortable-list'

/** The order after moving one entry a step; an entry at either end stays put. */
export const moved = (ids: readonly string[], id: string, step: -1 | 1): string[] => {
  const from = ids.indexOf(id)
  const to = from + step
  if (from === -1 || to < 0 || to >= ids.length) return [...ids]

  const order = [...ids]
  order.splice(from, 1)
  order.splice(to, 0, id)
  return order
}

/** The entry an add created: the one present after that was not there before. */
export const addedEntry = (
  before: RoutineResponse,
  after: RoutineResponse,
): RoutineEntryResponse | null => {
  const known = new Set(before.entries.map((entry) => entry.id))
  return after.entries.find((entry) => !known.has(entry.id)) ?? null
}

export interface RoutineEditorProps {
  readonly routine: RoutineResponse
  readonly exerciseNames: ReadonlyMap<string, string>
  /** The catalog to add from; archived exercises are never offered. */
  readonly exercises: readonly ExerciseResponse[]
  readonly pending: boolean
  readonly onReorder: (entryIds: string[]) => void
  readonly onEditEntry: (entry: RoutineEntryResponse) => void
  readonly onAdd: (exerciseId: string) => void
  readonly onRename: () => void
  readonly onDone: () => void
  /** Open with the exercise picker already showing, as an empty routine asks. */
  readonly initiallyAdding?: boolean
}

export const RoutineEditor = ({
  routine,
  exerciseNames,
  exercises,
  pending,
  onReorder,
  onEditEntry,
  onAdd,
  onRename,
  onDone,
  initiallyAdding = false,
}: RoutineEditorProps) => {
  const [adding, setAdding] = useState(initiallyAdding)
  const entries = [...routine.entries].sort((a, b) => a.position - b.position)
  const nameOf = (entry: RoutineEntryResponse) =>
    exerciseNames.get(entry.exerciseId) ?? 'Unknown exercise'
  // An exercise appears once in a plan; more sets are a target, not a second entry.
  const planned = new Set(entries.map((entry) => entry.exerciseId))
  const offered = exercises.filter((exercise) => !exercise.archived && !planned.has(exercise.id))

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-bold text-2xl">{routine.name}</h1>
        {/* Plain text, the way iOS ends an edit: the title keeps the width. */}
        <Button
          variant="ghost"
          className="min-h-touch px-2 font-semibold text-base text-primary"
          onClick={onDone}
        >
          Done
        </Button>
      </div>

      <SortableList
        items={entries}
        label={nameOf}
        card={(entry) => (
          <button
            type="button"
            aria-label={`Edit ${nameOf(entry)}`}
            onClick={() => onEditEntry(entry)}
            className="grid min-h-touch min-w-0 flex-1 rounded-xl bg-card px-4 py-3 text-left"
          >
            <span className="font-medium">{nameOf(entry)}</span>
            <span className="text-muted-foreground text-sm">
              {targetLabel(entry.targetSets, entry.targetReps)} · rest{' '}
              {restLabel(entry.restSeconds)}
            </span>
          </button>
        )}
        onReorder={onReorder}
      />

      {adding ? (
        <section className="grid gap-2">
          <h2 className="font-semibold text-base">Add an exercise</h2>
          {offered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Every exercise is already in this routine. Add more under Exercises.
            </p>
          ) : (
            <ul className="grid gap-2">
              {offered.map((exercise) => (
                <li key={exercise.id}>
                  <Button
                    variant="outline"
                    className="min-h-touch w-full justify-start"
                    aria-label={`Add ${exercise.name}`}
                    disabled={pending}
                    onClick={() => {
                      onAdd(exercise.id)
                      setAdding(false)
                    }}
                  >
                    <Plus className="size-4" />
                    {exercise.name}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <Button variant="outline" className="min-h-touch" onClick={() => setAdding(true)}>
          <Plus className="size-5" />
          Add an exercise
        </Button>
      )}

      <Button variant="ghost" className="min-h-touch" onClick={onRename}>
        <Pencil className="size-4" />
        Rename or archive
      </Button>
    </div>
  )
}
