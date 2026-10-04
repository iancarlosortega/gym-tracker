import { RecomputePageContainer } from '@/features/recompute/presentation/containers/recompute-page.container'

const RecomputePage = async ({ params }: { params: Promise<{ equipmentId: string }> }) => {
  const { equipmentId } = await params

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
      <RecomputePageContainer equipmentId={equipmentId} />
    </main>
  )
}

export default RecomputePage
