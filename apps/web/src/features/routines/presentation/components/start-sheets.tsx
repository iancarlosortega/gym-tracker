import { ListChecks, Play, Plus, Shuffle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UpNextTag } from './routine-views'

interface NamedRoutine {
  readonly id: string
  readonly name: string
}

const primaryClass = 'min-h-touch text-base'

/** From a Home row: a tap there opens this, never a start on its own. */
export const RoutineStartChoices = ({
  routine,
  starting,
  onStart,
}: {
  readonly routine: NamedRoutine
  readonly starting: boolean
  readonly onStart: () => void
}) => (
  <div className="grid gap-3">
    <Button className={primaryClass} disabled={starting} onClick={onStart}>
      <Play className="size-5" />
      Start {routine.name}
    </Button>
    <Link
      href={`/routines/${routine.id}`}
      className="flex min-h-touch items-center justify-center gap-2 rounded-lg border font-medium"
    >
      <ListChecks className="size-5" />
      See the plan
    </Link>
  </div>
)

export interface StartMenuProps {
  readonly upNext: NamedRoutine | null
  readonly starting: boolean
  readonly onStartUpNext: () => void
  readonly onPickAnother: () => void
  readonly onStartEmpty: () => void
}

/** The + is a quick action: choosing an item is the intent, so it starts at once. */
export const StartMenu = ({
  upNext,
  starting,
  onStartUpNext,
  onPickAnother,
  onStartEmpty,
}: StartMenuProps) => (
  <div className="grid gap-3">
    {upNext !== null && (
      <>
        <Button className={primaryClass} disabled={starting} onClick={onStartUpNext}>
          <Play className="size-5" />
          Start {upNext.name}
        </Button>
        <Button
          variant="outline"
          className={primaryClass}
          disabled={starting}
          onClick={onPickAnother}
        >
          <Shuffle className="size-5" />
          Pick a different routine
        </Button>
      </>
    )}
    <Button variant="outline" className={primaryClass} disabled={starting} onClick={onStartEmpty}>
      <Plus className="size-5" />
      Empty workout
    </Button>
  </div>
)

export const RoutinePicker = ({
  routines,
  upNextId,
  starting,
  onStart,
}: {
  readonly routines: readonly NamedRoutine[]
  readonly upNextId: string | null
  readonly starting: boolean
  readonly onStart: (routineId: string) => void
}) => {
  const ordered = [...routines].sort(
    (left, right) => Number(right.id === upNextId) - Number(left.id === upNextId),
  )

  return (
    <ul className="grid gap-2">
      {ordered.map((routine) => (
        <li key={routine.id}>
          <Button
            variant="outline"
            className="min-h-touch w-full justify-between text-base"
            disabled={starting}
            onClick={() => onStart(routine.id)}
          >
            {routine.name}
            {routine.id === upNextId && <UpNextTag />}
          </Button>
        </li>
      ))}
    </ul>
  )
}
