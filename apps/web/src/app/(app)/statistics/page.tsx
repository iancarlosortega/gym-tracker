import { ProgressTabs } from '@/features/history/presentation/components/progress-tabs'
import { WeekStatisticsContainer } from '@/features/statistics/presentation/containers/week-statistics.container'

const StatisticsPage = () => (
  <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
    <ProgressTabs current="progress" />
    <h1 className="font-bold text-2xl">This week</h1>
    <WeekStatisticsContainer />
  </main>
)

export default StatisticsPage
