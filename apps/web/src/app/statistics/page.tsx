import { connection } from 'next/server'
import { WeekStatisticsContainer } from '@/features/statistics/presentation/containers/week-statistics.container'
import { HttpWorkoutGateway } from '@/features/workouts/infrastructure/http-workout.gateway'

const StatisticsPage = async () => {
  await connection()

  const apiBaseUrl = process.env.API_ORIGIN

  if (apiBaseUrl === undefined || apiBaseUrl === '') {
    throw new Error('API_ORIGIN is not configured, so the app has no server to talk to.')
  }

  // The exercise list is a read like any other; a failure here leaves the
  // week summary to speak for itself rather than taking the page down.
  const exercises = await new HttpWorkoutGateway(apiBaseUrl).exercises().catch(() => [])

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
      <h1 className="font-bold text-2xl">This week</h1>
      <WeekStatisticsContainer
        apiBaseUrl={apiBaseUrl}
        exercises={exercises.filter((exercise) => !exercise.archived)}
      />
    </main>
  )
}

export default StatisticsPage
