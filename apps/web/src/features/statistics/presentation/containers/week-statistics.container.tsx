'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { useExercises } from '../../../workouts/presentation/queries'
import { WeekHeadline } from '../components/week-headline'
import { useWeekComparison } from '../queries'

/** Monday, so a week is the week a lifter thinks in. */
const startOfWeek = (instant: Date): Date => {
  const start = new Date(
    Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate()),
  )
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))

  return start
}

export const WeekStatisticsContainer = () => {
  const weekQuery = useWeekComparison(startOfWeek(new Date()))
  // A failed exercise read leaves the week summary to speak for itself rather
  // than taking the page down.
  const exercises = (useExercises().data ?? []).filter((exercise) => !exercise.archived)

  if (weekQuery.isError) {
    return <p role="alert">Could not reach the server, so this week cannot be summarised.</p>
  }

  if (weekQuery.isPending) {
    return <p>Reading your week…</p>
  }

  const week = weekQuery.data

  return (
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
  )
}
