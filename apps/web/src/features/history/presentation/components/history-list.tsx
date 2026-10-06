import { Button } from '@/components/ui/button'
import type { HistoryWeek } from '../history-grouping'
import { WorkoutRow } from './workout-row'

export interface HistoryListProps {
  readonly weeks: readonly HistoryWeek[]
  readonly zone: string
  readonly hasMore: boolean
  readonly loadingMore: boolean
  readonly onLoadMore: () => void
}

/** Past workouts under week headings, newest first, the way the week strip counts them. */
export const HistoryList = ({
  weeks,
  zone,
  hasMore,
  loadingMore,
  onLoadMore,
}: HistoryListProps) => {
  if (weeks.length === 0) {
    return (
      <div className="grid gap-1 rounded-xl bg-card p-4">
        <p className="font-semibold">No workouts yet.</p>
        <p className="text-muted-foreground text-sm">Start one with the button below.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      {weeks.map((week) => (
        <section key={week.monday} aria-label={week.label} className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              {week.label}
            </h2>
            <span className="text-muted-foreground text-xs tabular-nums">
              {week.entries.length} {week.entries.length === 1 ? 'workout' : 'workouts'}
            </span>
          </div>
          <ol className="grid gap-1.5">
            {week.entries.map((entry) => (
              <li key={entry.id}>
                <WorkoutRow entry={entry} zone={zone} />
              </li>
            ))}
          </ol>
        </section>
      ))}
      {hasMore && (
        <Button
          variant="outline"
          className="min-h-touch"
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          {loadingMore ? 'Loading…' : 'Show older workouts'}
        </Button>
      )}
    </div>
  )
}
