import Link from 'next/link'
import { WorkoutDetailContainer } from '@/features/history/presentation/containers/workout-detail.container'

const WorkoutHistoryPage = async ({ params }: { params: Promise<{ workoutId: string }> }) => {
  const { workoutId } = await params

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
      <Link className="text-muted-foreground text-sm" href="/statistics/history">
        ‹ History
      </Link>
      <WorkoutDetailContainer workoutId={workoutId} />
    </main>
  )
}

export default WorkoutHistoryPage
