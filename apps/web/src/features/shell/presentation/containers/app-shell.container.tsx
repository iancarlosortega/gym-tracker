'use client'

import { useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { offlineWork } from '../../../workouts/presentation/offline-work'
import {
  useFinishWorkout,
  useOpenWorkout,
  workoutsKeys,
} from '../../../workouts/presentation/queries'
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

/** The bottom of every tab screen: the running workout, if any, and the tabs. */
export const AppShellContainer = () => {
  useBackgroundSync()
  const workout = useOpenWorkout().data ?? null
  const finish = useFinishWorkout()
  const now = useNow(workout !== null)

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
      <TabBar pathname={usePathname()} workoutOpen={workout !== null} />
    </>
  )
}
