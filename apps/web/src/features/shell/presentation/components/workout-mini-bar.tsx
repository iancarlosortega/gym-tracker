import Link from 'next/link'

/** "32:10", or "1:05:09" past the hour; never negative when two clocks disagree. */
export const elapsed = (startedAt: Date, now: Date): string => {
  const total = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = String(total % 60).padStart(2, '0')

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`
}

export interface WorkoutMiniBarProps {
  readonly startedAt: Date
  readonly now: Date
  readonly finishing: boolean
  readonly onFinish: () => void
}

/** The workout left running while the user looks at something else. */
export const WorkoutMiniBar = ({ startedAt, now, finishing, onFinish }: WorkoutMiniBarProps) => (
  <div className="flex min-h-15 items-center gap-3 rounded-2xl border border-live bg-card py-2 pr-2 pl-4">
    <span className="size-2 shrink-0 rounded-full bg-live" aria-hidden="true" />
    <Link href="/workout" aria-label="Back to the workout" className="flex grow flex-col">
      <span className="font-bold">
        Workout · <span className="tabular-nums">{elapsed(startedAt, now)}</span>
      </span>
      <span className="text-muted-foreground text-sm">Tap to resume</span>
    </Link>
    <button
      type="button"
      onClick={onFinish}
      disabled={finishing}
      className="min-h-11 rounded-xl border border-border px-3.5 font-semibold text-sm"
    >
      Finish
    </button>
  </div>
)
