'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { QueryState } from '@/components/query-state'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
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
  WeekStrip,
} from '../components/home-views'

export const HomeContainer = () => {
  const router = useRouter()
  const now = new Date()
  const weekStart = startOfWeek(now)
  const routines = useRoutines()
  const week = useWeekComparison(weekStart).data ?? null
  const workoutOpen = (useOpenWorkout().data ?? null) !== null
  const start = useStartWorkout()
  const [picked, setPicked] = useState<HomeRoutine | null>(null)

  return (
    <QueryState
      query={routines}
      pending={<p>Reading your routines…</p>}
      failed={<p role="alert">Could not reach the server, so your routines cannot be shown.</p>}
    >
      {({ routines: list, upNextRoutineId }) => {
        const active = list.filter((routine) => !routine.archived)
        const upNext = active.find((routine) => routine.id === upNextRoutineId) ?? null

        return (
          <div className="grid gap-6">
            <HomeHeadline upNext={upNext} now={now} />

            {week !== null && (
              <section className="grid gap-3">
                <WeekStrip
                  weekStart={weekStart.toISOString().slice(0, 10)}
                  trainedOn={week.trainedOn}
                />
                <WeekHeadline current={week.current} previous={week.previous} />
              </section>
            )}

            {active.length > 0 && (
              <HomeRoutineList
                routines={active}
                upNextId={upNextRoutineId}
                workoutOpen={workoutOpen}
                now={now}
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
                      onStart={() =>
                        start.mutate(picked.id, { onSuccess: () => router.push('/workout') })
                      }
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
