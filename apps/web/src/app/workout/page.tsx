import { connection } from 'next/server'
import { WorkoutPageContainer } from '@/features/measurement/presentation/containers/workout-page.container'
import { PwaShellContainer } from '@/features/pwa/presentation/containers/pwa-shell.container'

/**
 * The API origin is read at request time, not baked into the bundle.
 *
 * A `NEXT_PUBLIC_` variable is inlined by `next build`, which would mean one
 * image per environment — and this deploys as a Docker image promoted onto a
 * VPS. `connection()` opts this route into dynamic rendering so the value is
 * read from the running container's environment and handed to the client
 * island as an ordinary prop. The cost is that the route is not prerendered,
 * which it could not usefully be anyway: it renders one person's workout.
 */
const WorkoutPage = async () => {
  await connection()

  const apiBaseUrl = process.env.API_ORIGIN

  if (apiBaseUrl === undefined || apiBaseUrl === '') {
    throw new Error('API_ORIGIN is not configured, so the app has no server to talk to.')
  }

  return (
    <main className="mx-auto grid max-w-screen-sm gap-6 p-4">
      <h1 className="text-2xl font-bold">Log a workout</h1>
      <PwaShellContainer />
      <WorkoutPageContainer apiBaseUrl={apiBaseUrl} />
    </main>
  )
}

export default WorkoutPage
