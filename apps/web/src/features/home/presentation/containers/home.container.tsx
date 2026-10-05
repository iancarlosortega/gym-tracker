'use client'

import { localDate } from '@gym/domain/shared/services/local-calendar'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { HomeSkeleton } from '@/components/loading-skeletons'
import { QueryState } from '@/components/query-state'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { localTimeZone } from '@/lib/local-time'
import { sessionSetsQuery } from '../../../measurement/presentation/session-sets.queries'
import { RoutineStartChoices } from '../../../routines/presentation/components/start-sheets'
import { useRoutines } from '../../../routines/presentation/queries'
import { WeekHeadline } from '../../../statistics/presentation/components/week-headline'
import { useWeekComparison } from '../../../statistics/presentation/queries'
import { startOfWeek } from '../../../statistics/presentation/week-start'
import { useOpenWorkout, useStartWorkout } from '../../../workouts/presentation/queries'
import {
  HomeHeadline,
  type HomeRoutine,
  HomeRoutineList,
  type OpenWorkoutProgress,
  WeekStrip,
} from '../components/home-views'
import { sessionProgress } from '../session-progress'

export const HomeContainer = () => {
  const router = useRouter()
  const now = new Date()
  const timeZone = localTimeZone()
  const weekStart = startOfWeek(now, timeZone)
  const routines = useRoutines()
  const week = useWeekComparison(weekStart).data ?? null
  const openWorkout = useOpenWorkout().data ?? null
  const workoutOpen = openWorkout !== null
  const openSets =
    useQuery({ ...sessionSetsQuery(openWorkout?.id ?? ''), enabled: workoutOpen }).data ?? []
  const start = useStartWorkout()
  const [picked, setPicked] = useState<HomeRoutine | null>(null)

  return (
    <QueryState
      query={routines}
      pending={<HomeSkeleton />}
      failed={<p role="alert">Could not reach the server, so your routines cannot be shown.</p>}
    >
      {({ routines: list, upNextRoutineId }) => {
        const active = list.filter((routine) => !routine.archived)
        const upNext = active.find((routine) => routine.id === upNextRoutineId) ?? null
        const followed = list.find((routine) => routine.id === openWorkout?.routineId) ?? null
        const open: OpenWorkoutProgress | null = workoutOpen
          ? {
              routineName: followed?.name ?? null,
              ...sessionProgress(followed?.entries ?? [], openSets),
            }
          : null

        return (
          <div className="grid gap-6">
            <HomeHeadline upNext={upNext} open={open} now={now} timeZone={timeZone} />

            {week !== null && (
              <section className="grid gap-3">
                <WeekStrip weekStart={localDate(weekStart, timeZone)} trainedOn={week.trainedOn} />
                <WeekHeadline current={week.current} previous={week.previous} />
              </section>
            )}

            {active.length > 0 && (
              <HomeRoutineList
                routines={active}
                upNextId={upNextRoutineId}
                workoutOpen={workoutOpen}
                now={now}
                timeZone={timeZone}
                onPick={setPicked}
              />
            )}

            <Drawer
              open={picked !== null}
              onOpenChange={(open) => {
                if (!open) setPicked(null)
                start.reset()
              }}
            >
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>{picked?.name}</DrawerTitle>
                </DrawerHeader>
                <div className="grid gap-3 px-4 pb-6">
                  {picked !== null && (
                    <RoutineStartChoices
                      routine={picked}
                      starting={start.isPending}
                      onStart={() => {
                        start.mutate(picked.id)
                        router.push('/workout')
                      }}
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
          </div>
        )
      }}
    </QueryState>
  )
}
