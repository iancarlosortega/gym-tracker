import { WeekStatisticsContainer } from '@/features/statistics/presentation/containers/week-statistics.container'

const StatisticsPage = () => (
  <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
    <h1 className="font-bold text-2xl">This week</h1>
    <WeekStatisticsContainer />
  </main>
)

export default StatisticsPage
