import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { WorkoutHistoryEntry } from '../../infrastructure/history.api'
import { durationLabel, weekdayAndDay } from '../history-grouping'

const setsLabel = (count: number) => `${count} ${count === 1 ? 'set' : 'sets'}`

/** One workout in History: its local day, its routine, and how much was done. */
export const WorkoutRow = ({
  entry,
  zone,
}: {
  readonly entry: WorkoutHistoryEntry
  readonly zone: string
}) => {
  const { weekday, day } = weekdayAndDay(entry.startedAt, zone)
  const duration = durationLabel(entry.startedAt, entry.finishedAt)
  const open = entry.finishedAt === null

  return (
    <Link
      href={`/statistics/history/${entry.id}`}
      className="grid min-h-touch grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-xl bg-card px-3 py-2.5"
    >
      <span className="grid justify-items-center leading-tight">
        <span className="font-semibold text-[0.65rem] text-muted-foreground uppercase tracking-wide">
          {weekday}
        </span>
        <span className="font-bold text-lg tabular-nums">{day}</span>
      </span>
      <span className="grid min-w-0">
        <span className="flex items-center gap-2 font-semibold">
          <span className="truncate">{entry.routineName ?? 'No routine'}</span>
          {open && (
            <span className="rounded-full bg-primary px-2 py-0.5 font-semibold text-[0.65rem] text-primary-foreground">
              In progress
            </span>
          )}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {duration === null
            ? setsLabel(entry.setCount)
            : `${setsLabel(entry.setCount)} · ${duration}`}
        </span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}
