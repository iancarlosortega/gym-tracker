'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { PlanSkeleton } from '@/components/loading-skeletons'
import { isWaitingForNetwork } from '@/components/query-state'
import { Button } from '@/components/ui/button'
import { EnablePocketedAlertsUseCase } from '../../../push/application/enable-pocketed-alerts.use-case'
import { PushSubscriber } from '../../../push/infrastructure/browser-push.subscriber'
import { pushApi } from '../../../push/infrastructure/push.api'
import { PocketedAlertsContainer } from '../../../push/presentation/containers/pocketed-alerts.container'
import { StartRestUseCase } from '../../../rest-timer/application/start-rest.use-case'
import { NavigatorScreenWakeLock } from '../../../rest-timer/infrastructure/navigator-screen-wake-lock.adapter'
import { WebAudioCompletionCue } from '../../../rest-timer/infrastructure/web-audio-completion-cue'
import { restSecondsFor } from '../../../routines/application/rest-seconds-for'
import { getRoutine } from '../../../routines/infrastructure/routines.api'
import { routinesKeys, useRoutines } from '../../../routines/presentation/queries'
import { SystemClock } from '../../../shared/infrastructure/system-clock.adapter'
import {
  type StartingWorkout,
  useEquipment,
  useExercises,
  useFinishWorkout,
  useOpenWorkout,
  useStartingWorkout,
  useStartWorkout,
} from '../../../workouts/presentation/queries'
import { CountPendingSetsUseCase } from '../../application/count-pending-sets.use-case'
import { LogSetOfflineUseCase } from '../../application/log-set-offline.use-case'
import { SyncPendingSetsUseCase } from '../../application/sync-pending-sets.use-case'
import { HttpSetSyncGateway } from '../../infrastructure/http-set-sync.gateway'
import { IndexedDbSetRepository } from '../../infrastructure/indexed-db-set.repository'
import { prefetchLastSets } from '../last-sets.queries'
import { WorkoutScreenContainer } from './workout-screen.container'

/** The workout screen between the tap on start and the server's answer. */
export const StartingWorkoutView = ({
  starting,
  routineName,
  onRetry,
}: {
  readonly starting: StartingWorkout
  readonly routineName: string | null
  readonly onRetry: () => void
}) => {
  if (starting.status === 'error') {
    return (
      <div className="grid gap-3">
        <p role="alert">Could not start {routineName ?? 'the workout'}.</p>
        <Button className="min-h-touch text-base" onClick={onRetry}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <h1 className="font-bold text-2xl">{routineName ?? 'Workout'}</h1>
      <p role="status" className="text-muted-foreground">
        {starting.offline ? "You're offline. It starts once you're back online." : 'Starting…'}
      </p>
      <PlanSkeleton />
    </div>
  )
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

  const starting = useStartingWorkout()
  const start = useStartWorkout()
  // While a start is in flight, "no workout yet" is not an answer worth asking for.
  const current = useOpenWorkout({ enabled: starting?.status !== 'pending' })
  const exercises = useExercises()
  const equipment = useEquipment()
  const routines = useRoutines()
  const routineId = current.data?.routineId ?? null
  // Null until the routine is read, and for an empty workout: rest then falls back.
  const routine =
    useQuery({
      queryKey: routinesKeys.detail(routineId ?? ''),
      queryFn: () => getRoutine(routineId ?? ''),
      enabled: routineId !== null,
    }).data ?? null
  const openSessionId = current.data?.id ?? null
  const queryClient = useQueryClient()

  useEffect(() => {
    if (routine === null) return
    void prefetchLastSets(
      queryClient,
      routine.entries.map((entry) => entry.exerciseId),
      openSessionId,
    )
  }, [routine, openSessionId, queryClient])

  if (starting !== null && current.data == null) {
    const name =
      routines.data?.routines.find((candidate) => candidate.id === starting.routineId)?.name ?? null
    return (
      <StartingWorkoutView
        starting={starting}
        routineName={name}
        onRetry={() => start.mutate(starting.routineId)}
      />
    )
  }

  const reads = [current, exercises, equipment]
  if (reads.some((read) => read.isError || isWaitingForNetwork(read))) {
    return <p role="alert">Could not reach the server. Sets you log will be kept and sent later.</p>
  }

  if (current.data === undefined || exercises.data === undefined || equipment.data === undefined) {
    return <PlanSkeleton />
  }

  if (current.data === null) {
    return (
      <Button className="min-h-touch text-base" onClick={() => start.mutate(undefined)}>
        Start a workout
      </Button>
    )
  }

  const session = current.data

  return (
    <div className="grid gap-6">
      <WorkoutScreenContainer
        sessionId={session.id}
        startedAt={new Date(session.startedAt)}
        routine={routine}
        exercises={exercises.data.filter((exercise) => !exercise.archived)}
        equipment={equipment.data.filter((item) => !item.archived)}
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
