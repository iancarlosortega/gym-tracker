import { ChevronRight, Pencil, Play, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { RoutineEntryResponse, RoutineResponse } from '../../infrastructure/routines.api'

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

export interface RoutineCardsProps {
  readonly routines: readonly RoutineResponse[]
  readonly exerciseNames: ReadonlyMap<string, string>
  readonly onNew: () => void
}

export const RoutineCards = ({ routines, exerciseNames, onNew }: RoutineCardsProps) => {
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
      <ul className="grid gap-2">
        {active.map((routine) => {
          const entries = inOrder(routine.entries)

          return (
            <li key={routine.id}>
              <Link
                href={`/routines/${routine.id}`}
                className="flex min-h-touch items-center justify-between gap-3 rounded-xl bg-card px-4 py-3"
              >
                <span className="grid gap-0.5">
                  <strong>{routine.name}</strong>
                  <span className="text-muted-foreground text-sm">
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
            </li>
          )
        })}
      </ul>
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
}

export const RoutinePlan = ({
  routine,
  exerciseNames,
  starting,
  startFailed,
  onStart,
  onEdit,
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
      <p className="text-muted-foreground">No exercises in this routine yet.</p>
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
