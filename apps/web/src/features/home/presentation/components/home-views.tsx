import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { UpNextTag } from '../../../routines/presentation/components/routine-views'

const DAY_MS = 86_400_000
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
/** Spelled out rather than taken from Intl, whose short months differ between runtimes. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const dayNumber = (instant: Date) => Math.floor(instant.getTime() / DAY_MS)

/** Today, yesterday, a weekday within the week, then a short date. */
export const lastDoneLabel = (lastDoneAt: string | null, now: Date): string => {
  if (lastDoneAt === null) return 'Never done'

  const done = new Date(lastDoneAt)
  const daysAgo = dayNumber(now) - dayNumber(done)
  if (daysAgo <= 0) return 'Last done today'
  if (daysAgo === 1) return 'Last done yesterday'
  if (daysAgo < 7) return `Last done ${WEEKDAYS[(done.getUTCDay() + 6) % 7]}`
  return `Last done ${done.getUTCDate()} ${MONTHS[done.getUTCMonth()]}`
}

export interface HomeRoutine {
  readonly id: string
  readonly name: string
  readonly lastDoneAt: string | null
}

const headlineClass = 'font-extrabold text-[40px] leading-[1.02] tracking-tight'

export const HomeHeadline = ({
  upNext,
  now,
}: {
  readonly upNext: Omit<HomeRoutine, 'id'> | null
  readonly now: Date
}) =>
  upNext === null ? (
    <div className="grid gap-3">
      <h1 className={headlineClass}>Nothing planned yet.</h1>
      <Link href="/routines" className="font-semibold text-primary text-lg">
        Make your first routine
      </Link>
    </div>
  ) : (
    <div className="grid gap-2">
      <h1 className={headlineClass}>{upNext.name} is up next.</h1>
      <p className="text-muted-foreground">{lastDoneLabel(upNext.lastDoneAt, now)}</p>
    </div>
  )

/** Monday to Sunday of this week, with the days trained filled in. */
export const WeekStrip = ({
  weekStart,
  trainedOn,
}: {
  /** ISO date of the Monday. */
  readonly weekStart: string
  readonly trainedOn: readonly string[]
}) => {
  const monday = new Date(`${weekStart}T00:00:00Z`).getTime()

  return (
    <ul className="grid grid-cols-7 gap-1.5">
      {WEEKDAYS.map((weekday, index) => {
        const trained = trainedOn.includes(
          new Date(monday + index * DAY_MS).toISOString().slice(0, 10),
        )

        return (
          <li
            key={weekday}
            aria-label={`${weekday}, ${trained ? 'trained' : 'rest day'}`}
            className={cn(
              'flex h-10 items-center justify-center rounded-lg font-semibold text-sm',
              trained ? 'bg-live text-background' : 'bg-muted text-muted-foreground',
            )}
          >
            {weekday[0]}
          </li>
        )
      })}
    </ul>
  )
}

export interface HomeRoutineListProps {
  readonly routines: readonly HomeRoutine[]
  readonly upNextId: string | null
  readonly workoutOpen: boolean
  readonly now: Date
  readonly onPick: (routine: HomeRoutine) => void
}

export const HomeRoutineList = ({
  routines,
  upNextId,
  workoutOpen,
  now,
  onPick,
}: HomeRoutineListProps) => (
  <section className="grid gap-2">
    <h2 className="font-semibold text-base">Your routines</h2>
    {workoutOpen && <p className="text-muted-foreground text-sm">Finish the open one first.</p>}
    <ul className="grid gap-2">
      {routines.map((routine) => (
        <li key={routine.id}>
          <button
            type="button"
            disabled={workoutOpen}
            onClick={() => onPick(routine)}
            className="flex min-h-touch w-full items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 text-left disabled:opacity-50"
          >
            <span className="grid gap-0.5">
              <span className="flex items-center gap-2">
                <strong>{routine.name}</strong>
                {routine.id === upNextId && <UpNextTag />}
              </span>
              <span className="text-muted-foreground text-sm">
                {lastDoneLabel(routine.lastDoneAt, now)}
              </span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  </section>
)
