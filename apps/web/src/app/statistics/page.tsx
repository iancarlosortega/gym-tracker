import { connection } from 'next/server'
import { WeekStatisticsContainer } from '@/features/statistics/presentation/containers/week-statistics.container'

const StatisticsPage = async () => {
  await connection()

  const apiBaseUrl = process.env.API_ORIGIN

  if (apiBaseUrl === undefined || apiBaseUrl === '') {
    throw new Error('API_ORIGIN is not configured, so the app has no server to talk to.')
  }

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
      <h1 className="font-bold text-2xl">This week</h1>
      <WeekStatisticsContainer apiBaseUrl={apiBaseUrl} />
    </main>
  )
}

export default StatisticsPage
