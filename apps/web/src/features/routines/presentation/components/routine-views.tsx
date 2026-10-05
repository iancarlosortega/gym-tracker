import { ChevronRight, Pencil, Play, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { RoutineEntryResponse, RoutineResponse } from '../../infrastructure/routines.api'
import { SortableList } from './sortable-list'

export const restLabel = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/** The API sends a range as "6-8"; it reads as "6–8". */
export const targetLabel = (sets: number | null, reps: string | null): string => {
  if (sets === null) return reps === null ? 'No target' : `${reps.replace('-', '–')} reps`
  if (reps === null) return `${sets} sets`
  return `${sets} × ${reps.replace('-', '–')}`
}

const inOrder = (entries: readonly RoutineEntryResponse[]) =>
  [...entries].sort((a, b) => a.position - b.position)

const nameOf = (names: ReadonlyMap<string, string>, exerciseId: string) =>
  names.get(exerciseId) ?? 'Unknown exercise'

export const UpNextTag = () => (
  <span className="rounded-full bg-live/15 px-2 py-0.5 font-semibold text-xs">Up next</span>
)

export interface RoutineCardsProps {
  readonly routines: readonly RoutineResponse[]
  readonly exerciseNames: ReadonlyMap<string, string>
  readonly upNextId?: string | null
  readonly onNew: () => void
  /** Given, the user can put the routines in their own order: every active routine id, in order. */
  readonly onReorder?: (routineIds: string[]) => void
}

/** One routine as a card that opens its plan. */
export const RoutineCard = ({
  routine,
  exerciseNames,
  upNext,
}: {
  readonly routine: RoutineResponse
  readonly exerciseNames: ReadonlyMap<string, string>
  readonly upNext: boolean
}) => {
  const entries = inOrder(routine.entries)

  return (
    <Link
      href={`/routines/${routine.id}`}
      className="flex min-h-touch min-w-0 flex-1 items-center justify-between gap-3 rounded-xl bg-card px-4 py-3"
    >
      <span className="grid min-w-0 gap-0.5">
        <span className="flex items-center gap-2">
          <strong>{routine.name}</strong>
          {upNext && <UpNextTag />}
        </span>
        <span className="truncate text-muted-foreground text-sm">
          {entries.length === 0
            ? 'No exercises yet'
            : entries.map((entry) => nameOf(exerciseNames, entry.exerciseId)).join(' · ')}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-muted-foreground text-sm">
        {entries.length} {entries.length === 1 ? 'exercise' : 'exercises'}
        <ChevronRight className="size-4" />
      </span>
    </Link>
  )
}

export const RoutineCards = ({
  routines,
  exerciseNames,
  upNextId,
  onNew,
  onReorder,
}: RoutineCardsProps) => {
  const active = routines.filter((routine) => !routine.archived)

  if (active.length === 0) {
    return (
      <div className="grid justify-items-center gap-3 py-10 text-center">
        <p className="text-muted-foreground">No routines yet.</p>
        <Button className="min-h-touch" onClick={onNew}>
          <Plus className="size-5" />
          Make your first routine
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <Button variant="outline" className="min-h-touch justify-self-start" onClick={onNew}>
        <Plus className="size-5" />
        New routine
      </Button>
      {onReorder === undefined ? (
        <ul className="grid gap-2">
          {active.map((routine) => (
            <li key={routine.id} className="flex">
              <RoutineCard
                routine={routine}
                exerciseNames={exerciseNames}
                upNext={routine.id === upNextId}
              />
            </li>
          ))}
        </ul>
      ) : (
        <SortableList
          items={active}
          label={(routine) => routine.name}
          card={(routine) => (
            <RoutineCard
              routine={routine}
              exerciseNames={exerciseNames}
              upNext={routine.id === upNextId}
            />
          )}
          onReorder={onReorder}
        />
      )}
    </div>
  )
}

export interface RoutinePlanProps {
  readonly routine: RoutineResponse
  readonly exerciseNames: ReadonlyMap<string, string>
  readonly starting: boolean
  readonly startFailed: boolean
  readonly onStart: () => void
  readonly onEdit: () => void
  /** Straight to the exercise picker, for a routine with nothing in it yet. */
  readonly onAddExercises: () => void
}

export const RoutinePlan = ({
  routine,
  exerciseNames,
  starting,
  startFailed,
  onStart,
  onEdit,
  onAddExercises,
}: RoutinePlanProps) => (
  <div className="grid gap-5">
    <div className="flex items-center justify-between gap-3">
      <h1 className="font-bold text-2xl">{routine.name}</h1>
      <Button variant="ghost" className="min-h-touch" onClick={onEdit}>
        <Pencil className="size-4" />
        Edit
      </Button>
    </div>

    {routine.entries.length === 0 ? (
      <div className="grid justify-items-start gap-3">
        <p className="text-muted-foreground">No exercises yet.</p>
        <Button variant="outline" className="min-h-touch" onClick={onAddExercises}>
          <Plus className="size-5" />
          Add exercises
        </Button>
      </div>
    ) : (
      <ol className="grid gap-2">
        {inOrder(routine.entries).map((entry, index) => (
          <li
            key={entry.id}
            className="grid min-h-touch grid-cols-[auto_1fr] items-center gap-x-3 rounded-xl bg-card px-4 py-3"
          >
            <span className="font-semibold text-muted-foreground">{index + 1}</span>
            <span className="grid">
              <span className="font-medium">{nameOf(exerciseNames, entry.exerciseId)}</span>
              <span className="text-muted-foreground text-sm">
                {targetLabel(entry.targetSets, entry.targetReps)} · rest{' '}
                {restLabel(entry.restSeconds)}
              </span>
            </span>
          </li>
        ))}
      </ol>
    )}

    {startFailed && (
      <p role="alert" className="text-destructive text-sm">
        Could not start it. Finish the open workout first, or try again once you're online.
      </p>
    )}

    <Button className="min-h-touch text-base" disabled={starting} onClick={onStart}>
      <Play className="size-5" />
      Start {routine.name}
    </Button>
  </div>
)
