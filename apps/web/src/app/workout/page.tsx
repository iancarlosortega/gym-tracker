import { WorkoutPageContainer } from '@/features/measurement/presentation/containers/workout-page.container'
import { PwaShellContainer } from '@/features/pwa/presentation/containers/pwa-shell.container'

const WorkoutPage = () => (
  <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
    <h1 className="text-2xl font-bold">Log a workout</h1>
    <PwaShellContainer />
    <WorkoutPageContainer />
  </main>
)

export default WorkoutPage
