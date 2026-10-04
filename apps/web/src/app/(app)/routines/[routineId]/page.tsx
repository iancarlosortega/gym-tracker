import { RoutinePlanContainer } from '@/features/routines/presentation/containers/routines.container'

const RoutinePlanPage = async ({ params }: { params: Promise<{ routineId: string }> }) => {
  const { routineId } = await params

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
      <RoutinePlanContainer routineId={routineId} />
    </main>
  )
}

export default RoutinePlanPage
