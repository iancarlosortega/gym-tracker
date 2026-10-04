import { RecomputePageContainer } from '@/features/recompute/presentation/containers/recompute-page.container'

const RecomputePage = async ({ params }: { params: Promise<{ equipmentId: string }> }) => {
  const { equipmentId } = await params

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
      <RecomputePageContainer equipmentId={equipmentId} />
    </main>
  )
}

export default RecomputePage
