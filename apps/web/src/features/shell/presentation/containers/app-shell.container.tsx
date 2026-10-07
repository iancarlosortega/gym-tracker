'use client'

import { useQueryClient } from '@tanstack/react-query'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { localTimeZone } from '@/lib/local-time'
import { RoutinePicker, StartMenu } from '../../../routines/presentation/components/start-sheets'
import { useRoutines } from '../../../routines/presentation/queries'
import { offlineWork } from '../../../workouts/presentation/offline-work'
import {
  useFinishWorkout,
  useOpenWorkout,
  useStartWorkout,
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

type StartSheet = 'menu' | 'picker'

/** The + menu and the routine picker; both start at once, then go to the workout. */
const useStartSheets = () => {
  const router = useRouter()
  const listing = useRoutines().data ?? null
  const start = useStartWorkout()
  const [sheet, setSheet] = useState<StartSheet | null>(null)
  const routines = (listing?.routines ?? []).filter((routine) => !routine.archived)
  const upNext = routines.find((routine) => routine.id === listing?.upNextRoutineId) ?? null

  /** The workout screen opens on the tap and shows the start while the server confirms it. */
  const startWith = (routineId?: string) => {
    start.mutate(routineId)
    setSheet(null)
    router.push('/workout')
  }

  const sheets = (
    <Drawer
      open={sheet !== null}
      onOpenChange={(open) => {
        if (!open) setSheet(null)
        start.reset()
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {sheet === 'picker' ? 'Start which routine?' : 'Start a workout'}
          </DrawerTitle>
        </DrawerHeader>
        <div className="grid gap-3 px-4 pb-6">
          {sheet === 'menu' && (
            <StartMenu
              upNext={upNext}
              starting={start.isPending}
              onStartUpNext={() => startWith(upNext?.id)}
              onPickAnother={() => setSheet('picker')}
              onStartEmpty={() => startWith()}
            />
          )}
          {sheet === 'picker' && (
            <RoutinePicker
              routines={routines}
              upNextId={upNext?.id ?? null}
              starting={start.isPending}
              now={new Date()}
              timeZone={localTimeZone()}
              onStart={startWith}
              onBack={() => setSheet('menu')}
              onManage={() => setSheet(null)}
            />
          )}
          {start.isError && (
            <p role="alert" className="text-destructive text-sm">
              Could not start it. Try again once you're online.
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )

  return { open: () => setSheet('menu'), sheets }
}

/** The bottom of every tab screen: the running workout, if any, and the tabs. */
export const AppShellContainer = () => {
  useBackgroundSync()
  const workout = useOpenWorkout().data ?? null
  const finish = useFinishWorkout()
  const now = useNow(workout !== null)
  const startSheets = useStartSheets()

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
      <TabBar pathname={usePathname()} workoutOpen={workout !== null} onStart={startSheets.open} />
      {startSheets.sheets}
    </>
  )
}
