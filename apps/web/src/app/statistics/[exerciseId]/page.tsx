import Link from 'next/link'
import { connection } from 'next/server'
import { ExerciseProgressionContainer } from '@/features/statistics/presentation/containers/exercise-progression.container'

const ExerciseStatisticsPage = async ({ params }: { params: Promise<{ exerciseId: string }> }) => {
  await connection()

  const apiBaseUrl = process.env.API_ORIGIN

  if (apiBaseUrl === undefined || apiBaseUrl === '') {
    throw new Error('API_ORIGIN is not configured, so the app has no server to talk to.')
  }

  const { exerciseId } = await params

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
      <Link className="text-muted-foreground text-sm" href="/statistics">
        ‹ This week
      </Link>
      <ExerciseProgressionContainer apiBaseUrl={apiBaseUrl} exerciseId={exerciseId} />
    </main>
  )
}

export default ExerciseStatisticsPage
