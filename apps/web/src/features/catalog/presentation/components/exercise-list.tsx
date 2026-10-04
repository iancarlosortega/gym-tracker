'use client'

import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ExerciseResponse } from '../../../workouts/infrastructure/workouts.api'

export const modeLabel = (mode: MeasurementMode): string => {
  switch (mode) {
    case 'TOTAL':
      return 'total'
    case 'PER_SIDE':
      return 'per side'
    case 'STACK_POSITION':
      return 'pin position'
  }
}

export interface ExerciseListProps {
  readonly exercises: readonly ExerciseResponse[]
  readonly onNew: () => void
  readonly onEdit: (exercise: ExerciseResponse) => void
}

const ExerciseRow = ({
  exercise,
  onEdit,
}: {
  readonly exercise: ExerciseResponse
  readonly onEdit: (exercise: ExerciseResponse) => void
}) => (
  <li>
    <button
      type="button"
      aria-label={`Edit ${exercise.name}`}
      onClick={() => onEdit(exercise)}
      className="flex min-h-touch w-full items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 text-left"
    >
      <span className={exercise.archived ? 'text-muted-foreground' : undefined}>
        {exercise.name}
      </span>
      <span className="flex items-center gap-2">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-muted-foreground text-xs">
          {modeLabel(exercise.defaultMode)}
        </span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </span>
    </button>
  </li>
)

export const ExerciseList = ({ exercises, onNew, onEdit }: ExerciseListProps) => {
  const [showArchived, setShowArchived] = useState(false)
  const active = exercises.filter((exercise) => !exercise.archived)
  const archived = exercises.filter((exercise) => exercise.archived)

  if (exercises.length === 0) {
    return (
      <div className="grid justify-items-center gap-3 py-10 text-center">
        <p className="text-muted-foreground">No exercises yet.</p>
        <Button className="min-h-touch" onClick={onNew}>
          <Plus className="size-5" />
          Add your first exercise
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <Button variant="outline" className="min-h-touch justify-self-start" onClick={onNew}>
        <Plus className="size-5" />
        New exercise
      </Button>

      <ul className="grid gap-2">
        {active.map((exercise) => (
          <ExerciseRow key={exercise.id} exercise={exercise} onEdit={onEdit} />
        ))}
      </ul>

      {archived.length > 0 &&
        (showArchived ? (
          <section className="grid gap-2">
            <h2 className="font-semibold text-muted-foreground text-sm">Archived</h2>
            <ul className="grid gap-2">
              {archived.map((exercise) => (
                <ExerciseRow key={exercise.id} exercise={exercise} onEdit={onEdit} />
              ))}
            </ul>
          </section>
        ) : (
          <Button
            variant="ghost"
            className="justify-self-start"
            onClick={() => setShowArchived(true)}
          >
            Show archived ({archived.length})
          </Button>
        ))}
    </div>
  )
}
