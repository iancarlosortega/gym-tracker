'use client'

import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { localTimeZone } from '@/lib/local-time'
import { useRoutines } from '../../../routines/presentation/queries'
import { offlineWork } from '../../../workouts/presentation/offline-work'
import {
  useFinishWorkout,
  useOpenWorkout,
  useStartWorkout,
  workoutsKeys,
} from '../../../workouts/presentation/queries'
import { StartPopover } from '../components/start-popover'
import { TabBar } from '../components/tab-bar'
import { WorkoutMiniBar } from '../components/workout-mini-bar'

/** A clock for the elapsed time; it only ticks while something shows it. */
const useNow = (ticking: boolean): Date => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!ticking) return
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [ticking])

  return now
}

/**
 * Whatever the phone still owes the server goes out when the app opens and
 * whenever the connection comes back — not only while the workout screen is
 * up, because a workout can be finished from here and the screen never seen
 * again.
 */
const useBackgroundSync = () => {
  const client = useQueryClient()

  useEffect(() => {
    const drain = () => {
      void offlineWork()
        .sync.execute()
        .then(() => client.invalidateQueries({ queryKey: workoutsKeys.all }))
    }

    drain()
    globalThis.addEventListener?.('online', drain)
    return () => globalThis.removeEventListener?.('online', drain)
  }, [client])
}

/** The + and its start choices; every choice starts at once, then goes to the workout. */
const useStartPopover = () => {
  const router = useRouter()
  const listing = useRoutines().data ?? null
  const start = useStartWorkout()
  const routines = (listing?.routines ?? []).filter((routine) => !routine.archived)
  const upNext = routines.find((routine) => routine.id === listing?.upNextRoutineId) ?? null

  /** The workout screen opens on the tap and shows the start while the server confirms it. */
  const startWith = (routineId?: string) => {
    start.mutate(routineId)
    router.push('/workout')
  }

  return (
    <StartPopover
      upNext={upNext}
      routines={routines}
      starting={start.isPending}
      failed={start.isError}
      now={new Date()}
      timeZone={localTimeZone()}
      onStart={startWith}
      onOpenChange={() => start.reset()}
    />
  )
}

/** The bottom of every tab screen: the running workout, if any, and the tabs. */
export const AppShellContainer = () => {
  useBackgroundSync()
  const workout = useOpenWorkout().data ?? null
  const finish = useFinishWorkout()
  const now = useNow(workout !== null)
  const startMenu = useStartPopover()

  return (
    <>
      {workout !== null && (
        <div className="px-3 pb-2.5">
          <WorkoutMiniBar
            startedAt={new Date(workout.startedAt)}
            now={now}
            finishing={finish.isPending}
            onFinish={() => finish.mutate(workout.id)}
          />
        </div>
      )}
      <TabBar pathname={usePathname()} workoutOpen={workout !== null} startMenu={startMenu} />
    </>
  )
}
