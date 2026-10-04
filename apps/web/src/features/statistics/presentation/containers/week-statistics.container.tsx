'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  type ExerciseResponse,
  HttpWorkoutGateway,
} from '../../../workouts/infrastructure/http-workout.gateway'
import {
  HttpStatisticsGateway,
  type WeekComparisonResponse,
} from '../../infrastructure/http-statistics.gateway'
import { WeekHeadline } from '../components/week-headline'

export interface WeekStatisticsContainerProps {
  readonly apiBaseUrl: string
}

/** Monday, so a week is the week a lifter thinks in. */
const startOfWeek = (instant: Date): Date => {
  const start = new Date(
    Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate()),
  )
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))

  return start
}

export const WeekStatisticsContainer = ({ apiBaseUrl }: WeekStatisticsContainerProps) => {
  const gateway = useMemo(() => new HttpStatisticsGateway(apiBaseUrl), [apiBaseUrl])
  const workouts = useMemo(() => new HttpWorkoutGateway(apiBaseUrl), [apiBaseUrl])
  const [week, setWeek] = useState<WeekComparisonResponse | null>(null)
  const [exercises, setExercises] = useState<readonly ExerciseResponse[]>([])
  const [unreachable, setUnreachable] = useState(false)

  useEffect(() => {
    void gateway
      .week(startOfWeek(new Date()))
      .then(setWeek)
      .catch(() => setUnreachable(true))
  }, [gateway])

  // Read from the browser, which holds the session cookie; a server-side read
  // has no session and was always refused. A failure leaves the week summary
  // to speak for itself rather than taking the page down.
  useEffect(() => {
    void workouts
      .exercises()
      .then((all) => setExercises(all.filter((exercise) => !exercise.archived)))
      .catch(() => setExercises([]))
  }, [workouts])

  if (unreachable) {
    return <p role="alert">Could not reach the server, so this week cannot be summarised.</p>
  }

  if (week === null) {
    return <p>Reading your week…</p>
  }

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
