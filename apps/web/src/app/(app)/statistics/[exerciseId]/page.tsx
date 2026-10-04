import Link from 'next/link'
import { ExerciseProgressionContainer } from '@/features/statistics/presentation/containers/exercise-progression.container'

const ExerciseStatisticsPage = async ({ params }: { params: Promise<{ exerciseId: string }> }) => {
  const { exerciseId } = await params

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
      <Link className="text-muted-foreground text-sm" href="/statistics">
        ‹ This week
      </Link>
      <ExerciseProgressionContainer exerciseId={exerciseId} />
    </main>
  )
}

export default ExerciseStatisticsPage
