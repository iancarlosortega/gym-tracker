import { Suspense } from 'react'
import { ListSkeleton } from '@/components/loading-skeletons'
import { ProgressTabs } from '@/features/history/presentation/components/progress-tabs'
import { HistoryContainer } from '@/features/history/presentation/containers/history.container'

const HistoryPage = () => (
  <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
    <ProgressTabs current="history" />
    {/* The view is read from the address, which only the browser has. */}
    <Suspense fallback={<ListSkeleton label="Loading your history" />}>
      <HistoryContainer />
    </Suspense>
  </main>
)

export default HistoryPage
