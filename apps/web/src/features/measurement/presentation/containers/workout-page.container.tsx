'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { PlanSkeleton } from '@/components/loading-skeletons'
import { EnablePocketedAlertsUseCase } from '../../../push/application/enable-pocketed-alerts.use-case'
import { PushSubscriber } from '../../../push/infrastructure/browser-push.subscriber'
import { pushApi } from '../../../push/infrastructure/push.api'
import { PocketedAlertsContainer } from '../../../push/presentation/containers/pocketed-alerts.container'
import { StartRestUseCase } from '../../../rest-timer/application/start-rest.use-case'
import { NavigatorScreenWakeLock } from '../../../rest-timer/infrastructure/navigator-screen-wake-lock.adapter'
import { WebAudioCompletionCue } from '../../../rest-timer/infrastructure/web-audio-completion-cue'
import { restSecondsFor } from '../../../routines/application/rest-seconds-for'
import { getRoutine, type RoutineResponse } from '../../../routines/infrastructure/routines.api'
import { SystemClock } from '../../../shared/infrastructure/system-clock.adapter'
import {
  type EquipmentResponse,
  type ExerciseResponse,
  getCurrentWorkout,
  getEquipment,
  getExercises,
  startWorkout,
  type WorkoutSessionResponse,
} from '../../../workouts/infrastructure/workouts.api'
import { offlineWork } from '../../../workouts/presentation/offline-work'
import { openWorkout } from '../../../workouts/presentation/open-workout'
import { useFinishWorkout } from '../../../workouts/presentation/queries'
import { CountPendingSetsUseCase } from '../../application/count-pending-sets.use-case'
import { LogSetOfflineUseCase } from '../../application/log-set-offline.use-case'
import { SyncPendingSetsUseCase } from '../../application/sync-pending-sets.use-case'
import { HttpSetSyncGateway } from '../../infrastructure/http-set-sync.gateway'
import { IndexedDbSetRepository } from '../../infrastructure/indexed-db-set.repository'
import { prefetchLastSets } from '../last-sets.queries'
import { WorkoutScreenContainer } from './workout-screen.container'

interface WorkoutContext {
  readonly session: WorkoutSessionResponse | null
  readonly exercises: readonly ExerciseResponse[]
  readonly equipment: readonly EquipmentResponse[]
}

/**
 * The composition root of the logging surface.
 *
 * A client island, not a Server Component, because everything below it has to
 * keep working with the API unreachable — and a server-rendered page cannot
 * be rendered from a basement.
 */
export const WorkoutPageContainer = () => {
  const router = useRouter()
  const finish = useFinishWorkout()
  const wiring = useMemo(() => {
    const queue = new IndexedDbSetRepository()
    const clock = new SystemClock()
    const wakeLock = new NavigatorScreenWakeLock()
    return {
      enableAlerts: new EnablePocketedAlertsUseCase(new PushSubscriber(), pushApi),
      queue,
      logSet: new LogSetOfflineUseCase(queue),
      syncSets: new SyncPendingSetsUseCase(queue, new HttpSetSyncGateway()),
      countPending: new CountPendingSetsUseCase(queue),
      startRest: new StartRestUseCase(clock, wakeLock),
      cue: new WebAudioCompletionCue(),
      clock,
      wakeLock,
    }
  }, [])

  const [context, setContext] = useState<WorkoutContext | null>(null)
  const [unreachable, setUnreachable] = useState(false)
  // Null until the routine is read, and for an empty workout: rest then falls back.
  const [routine, setRoutine] = useState<RoutineResponse | null>(null)
  const routineId = context?.session?.routineId ?? null
  const openSessionId = context?.session?.id ?? null
  const queryClient = useQueryClient()

  useEffect(() => {
    if (routineId === null) return
    // Offline the routine cannot be read; logging still works on the fallback rest.
    void getRoutine(routineId)
      .then((followed) => {
        setRoutine(followed)
        void prefetchLastSets(
          queryClient,
          followed.entries.map((entry) => entry.exerciseId),
          openSessionId,
        )
      })
      .catch(() => setRoutine(null))
  }, [routineId, openSessionId, queryClient])

  useEffect(() => {
    void (async () => {
      try {
        const [session, exercises, equipment] = await Promise.all([
          // A finish pressed offline closes the workout here before the server hears of it.
          getCurrentWorkout().then(async (current) =>
            openWorkout(current, await offlineWork().finishes.all()),
          ),
          getExercises(),
          getEquipment(),
        ])

        setContext({ session, exercises, equipment })
      } catch {
        setUnreachable(true)
      }
    })()
  }, [])

  if (unreachable) {
    return <p role="alert">Could not reach the server. Sets you log will be kept and sent later.</p>
  }

  if (context === null) {
    return <PlanSkeleton />
  }

  if (context.session === null) {
    return (
      <button
        type="button"
        onClick={() => {
          void startWorkout()
            .then((session) => setContext({ ...context, session }))
            .catch(() => setUnreachable(true))
        }}
      >
        Start a workout
      </button>
    )
  }

  const session = context.session

  return (
    <div className="grid gap-6">
      <WorkoutScreenContainer
        sessionId={session.id}
        startedAt={new Date(session.startedAt)}
        routine={routine}
        exercises={context.exercises.filter((exercise) => !exercise.archived)}
        equipment={context.equipment.filter((item) => !item.archived)}
        queue={wiring.queue}
        logSet={wiring.logSet}
        syncSets={wiring.syncSets}
        countPending={wiring.countPending}
        startRest={wiring.startRest}
        restSecondsFor={restSecondsFor(routine?.entries ?? null)}
        clock={wiring.clock}
        wakeLock={wiring.wakeLock}
        cue={wiring.cue}
        push={pushApi}
        finishing={finish.isPending}
        onFinish={() => finish.mutate(session.id, { onSuccess: () => router.push('/') })}
      />
      <PocketedAlertsContainer gateway={pushApi} enableAlerts={wiring.enableAlerts} />
    </div>
  )
}
