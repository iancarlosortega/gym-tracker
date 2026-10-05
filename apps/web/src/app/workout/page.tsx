import { WorkoutPageContainer } from '@/features/measurement/presentation/containers/workout-page.container'
import { PwaShellContainer } from '@/features/pwa/presentation/containers/pwa-shell.container'

const WorkoutPage = () => (
  <main className="mx-auto grid w-full max-w-screen-sm gap-6 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
    <PwaShellContainer />
    <WorkoutPageContainer />
  </main>
)

export default WorkoutPage
