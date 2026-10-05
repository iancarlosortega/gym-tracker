'use client'

import Link from 'next/link'
import { ListSkeleton } from '@/components/loading-skeletons'
import { QueryState } from '@/components/query-state'
import { Card } from '@/components/ui/card'
import { useExercises } from '../../../workouts/presentation/queries'
import { WeekHeadline } from '../components/week-headline'
import { useWeekComparison } from '../queries'
import { startOfWeek } from '../week-start'

export const WeekStatisticsContainer = () => {
  const weekQuery = useWeekComparison(startOfWeek(new Date()))
  // A failed exercise read leaves the week summary to speak for itself rather
  // than taking the page down.
  const exercises = (useExercises().data ?? []).filter((exercise) => !exercise.archived)

  return (
    <QueryState
      query={weekQuery}
      pending={<ListSkeleton label="Loading your week" />}
      failed={<p role="alert">Could not reach the server, so this week cannot be summarised.</p>}
    >
      {(week) => (
        <div className="grid gap-5">
          <WeekHeadline current={week.current} previous={week.previous} />

          <div className="grid gap-2">
            <h2 className="font-semibold text-base">By exercise</h2>
            {exercises.length === 0 ? (
              <p className="text-muted-foreground text-sm">No exercises yet.</p>
            ) : (
              exercises.map((exercise) => (
                <Link href={`/statistics/${exercise.id}`} key={exercise.id}>
                  <Card className="flex min-h-touch flex-row items-center justify-between px-4 py-3">
                    <span>{exercise.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {exercise.defaultMode === 'STACK_POSITION' ? 'pin position' : 'weight'}
                    </span>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </QueryState>
  )
}
