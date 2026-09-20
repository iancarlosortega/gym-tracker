import { connection } from 'next/server'
import { RecomputePageContainer } from '@/features/recompute/presentation/containers/recompute-page.container'

const RecomputePage = async ({ params }: { params: Promise<{ equipmentId: string }> }) => {
  await connection()

  const apiBaseUrl = process.env.API_ORIGIN

  if (apiBaseUrl === undefined || apiBaseUrl === '') {
    throw new Error('API_ORIGIN is not configured, so the app has no server to talk to.')
  }

  const { equipmentId } = await params

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
      <RecomputePageContainer apiBaseUrl={apiBaseUrl} equipmentId={equipmentId} />
    </main>
  )
}

export default RecomputePage
