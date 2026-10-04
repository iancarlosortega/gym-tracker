import { WorkoutPageContainer } from '@/features/measurement/presentation/containers/workout-page.container'
import { PwaShellContainer } from '@/features/pwa/presentation/containers/pwa-shell.container'

const WorkoutPage = () => (
  // Outside the tab layout, so it clears the status bar itself.
  <main className="mx-auto grid max-w-screen-sm gap-6 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
    <PwaShellContainer />
    <WorkoutPageContainer />
  </main>
)

export default WorkoutPage
