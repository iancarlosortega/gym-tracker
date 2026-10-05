'use client'

import { useState } from 'react'
import { ListSkeleton } from '@/components/loading-skeletons'
import { isWaitingForNetwork, OfflineNotice } from '@/components/query-state'
import { Button } from '@/components/ui/button'
import { unitLabel } from '@/lib/units'
import { useDisplayUnit } from '../../../auth/presentation/queries'
import { useExercises } from '../../../workouts/presentation/queries'
import type { ExerciseProgressionResponse } from '../../infrastructure/statistics.api'
import { ModeChangeNotice } from '../components/mode-change-notice'
import { ProgressionChart } from '../components/progression-chart'
import { inDisplayUnit } from '../progression-unit'
import { useExerciseProgression } from '../queries'

export interface ExerciseProgressionContainerProps {
  readonly exerciseId: string
}

const WEEKS_SHOWN = 12
const WEEK_MILLISECONDS = 7 * 24 * 60 * 60 * 1000

type Metric = 'load' | 'reps'

/** Fixed once per visit: a range read from the clock on every render would be a new query key each time. */
const lastWeeks = (): { readonly from: Date; readonly to: Date } => {
  const to = new Date()
  return { from: new Date(to.getTime() - WEEKS_SHOWN * WEEK_MILLISECONDS), to }
}

export const ExerciseProgressionContainer = ({ exerciseId }: ExerciseProgressionContainerProps) => {
  const [range] = useState(lastWeeks)
  const progressionQuery = useExerciseProgression(exerciseId, range.from, range.to)
  // A failed name lookup keeps the plain fallback rather than hiding the chart.
  const exerciseName =
    useExercises().data?.find((candidate) => candidate.id === exerciseId)?.name ?? 'This exercise'
  const [metric, setMetric] = useState<Metric>('load')
  const unit = useDisplayUnit()

  if (progressionQuery.isError) {
    return <p role="alert">Could not reach the server, so this progression cannot be shown.</p>
  }

  if (isWaitingForNetwork(progressionQuery)) {
    return <OfflineNotice />
  }

  if (progressionQuery.isPending) {
    return <ListSkeleton label="Loading your progression" />
  }

  const progression = progressionQuery.data

  return (
    <div className="grid gap-5">
      <h1 className="font-bold text-2xl">{exerciseName}</h1>

      <fieldset className="flex gap-2 border-0 p-0">
        <legend className="sr-only">What to measure progress by</legend>
        <Button
          aria-pressed={metric === 'load'}
          onClick={() => setMetric('load')}
          variant={metric === 'load' ? 'default' : 'outline'}
        >
          Weight
        </Button>
        <Button
          aria-pressed={metric === 'reps'}
          onClick={() => setMetric('reps')}
          variant={metric === 'reps' ? 'default' : 'outline'}
        >
          Reps
        </Button>
      </fieldset>

      <ModeChangeNotice changes={progression.modeChanges} />

      {progression.series.length === 0 ? (
        <p className="text-muted-foreground">Nothing logged for this exercise yet.</p>
      ) : (
        progression.series
          .map((fromApi) => inDisplayUnit(fromApi, unit))
          .map((series) => (
            <section className="grid gap-3" key={series.mode}>
              <h2 className="font-semibold text-base">
                {series.unit === 'position' ? 'Pin position' : `Weight (${unitLabel(unit)})`}
              </h2>
              <ProgressionChart
                series={metric === 'reps' ? asRepsSeries(series) : series}
                unit={unit}
              />

              <ul className="m-0 grid list-none gap-2 p-0">
                {[...series.points].reverse().map((point) => (
                  <li
                    className="flex min-h-11 items-center gap-3 rounded-md border border-border px-4 py-2"
                    key={point.periodStart}
                  >
                    <span className="grow text-muted-foreground text-sm">
                      {new Date(point.periodStart).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span className="font-bold tabular-nums">
                      {series.unit === 'position'
                        ? `position ${point.value}`
                        : `${point.value} ${unitLabel(unit)}`}{' '}
                      · {point.reps}
                    </span>
                    <span className="w-24 text-right text-xs">{changeLabel(point.change)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))
      )}
    </div>
  )
}

/**
 * The same weeks, charted by repetitions instead of load.
 *
 * A reps chart is only honest next to the load it was lifted at, which is why
 * the load moves into the caption line rather than disappearing.
 */
const asRepsSeries = (series: ExerciseProgressionResponse['series'][number]) => ({
  ...series,
  points: series.points.map((point) => ({ ...point, value: point.reps, reps: point.value })),
})

const changeLabel = (
  change: ExerciseProgressionResponse['series'][number]['points'][number]['change'],
) => {
  switch (change) {
    case 'improved-load':
      return 'heavier'
    case 'improved-reps':
      return 'more reps'
    case 'declined':
      return 'down'
    default:
      return 'held'
  }
}
