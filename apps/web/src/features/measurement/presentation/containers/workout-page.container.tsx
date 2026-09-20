'use client'

import { useEffect, useMemo, useState } from 'react'
import { EnablePocketedAlertsUseCase } from '../../../push/application/enable-pocketed-alerts.use-case'
import { PushSubscriber } from '../../../push/infrastructure/browser-push.subscriber'
import { HttpPushGateway } from '../../../push/infrastructure/http-push.gateway'
import { PocketedAlertsContainer } from '../../../push/presentation/containers/pocketed-alerts.container'
import { StartRestUseCase } from '../../../rest-timer/application/start-rest.use-case'
import { NavigatorScreenWakeLock } from '../../../rest-timer/infrastructure/navigator-screen-wake-lock.adapter'
import { WebAudioCompletionCue } from '../../../rest-timer/infrastructure/web-audio-completion-cue'
import { SystemClock } from '../../../shared/infrastructure/system-clock.adapter'
import {
  type EquipmentResponse,
  type ExerciseResponse,
  HttpWorkoutGateway,
  type WorkoutSessionResponse,
} from '../../../workouts/infrastructure/http-workout.gateway'
import { CountPendingSetsUseCase } from '../../application/count-pending-sets.use-case'
import { LogSetOfflineUseCase } from '../../application/log-set-offline.use-case'
import { SyncPendingSetsUseCase } from '../../application/sync-pending-sets.use-case'
import { HttpSetSyncGateway } from '../../infrastructure/http-set-sync.gateway'
import { IndexedDbSetRepository } from '../../infrastructure/indexed-db-set.repository'
import { LogWorkoutContainer } from './log-workout.container'

export interface WorkoutPageContainerProps {
  readonly apiBaseUrl: string
}

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
export const WorkoutPageContainer = ({ apiBaseUrl }: WorkoutPageContainerProps) => {
  const wiring = useMemo(() => {
    const queue = new IndexedDbSetRepository()
    const clock = new SystemClock()
    const wakeLock = new NavigatorScreenWakeLock()
    const push = new HttpPushGateway(apiBaseUrl)

    return {
      push,
      enableAlerts: new EnablePocketedAlertsUseCase(new PushSubscriber(), push),
      workouts: new HttpWorkoutGateway(apiBaseUrl),
      logSet: new LogSetOfflineUseCase(queue),
      syncSets: new SyncPendingSetsUseCase(queue, new HttpSetSyncGateway(apiBaseUrl)),
      countPending: new CountPendingSetsUseCase(queue),
      startRest: new StartRestUseCase(clock, wakeLock),
      cue: new WebAudioCompletionCue(),
      clock,
      wakeLock,
    }
  }, [apiBaseUrl])

  const [context, setContext] = useState<WorkoutContext | null>(null)
  const [unreachable, setUnreachable] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const [session, exercises, equipment] = await Promise.all([
          wiring.workouts.currentWorkout(),
          wiring.workouts.exercises(),
          wiring.workouts.equipment(),
        ])

        setContext({ session, exercises, equipment })
      } catch {
        setUnreachable(true)
      }
    })()
  }, [wiring])

  if (unreachable) {
    return <p role="alert">Could not reach the server. Sets you log will be kept and sent later.</p>
  }

  if (context === null) {
    return <p>Loading your workout…</p>
  }

  if (context.session === null) {
    return (
      <button
        type="button"
        onClick={() => {
          void wiring.workouts
            .startWorkout()
            .then((session) => setContext({ ...context, session }))
            .catch(() => setUnreachable(true))
        }}
      >
        Start a workout
      </button>
    )
  }

  return (
    <div className="grid gap-6">
      <PocketedAlertsContainer gateway={wiring.push} enableAlerts={wiring.enableAlerts} />
      <LogWorkoutContainer
        sessionId={context.session.id}
        exercises={context.exercises.filter((exercise) => !exercise.archived)}
        equipment={context.equipment.filter((item) => !item.archived)}
        logSet={wiring.logSet}
        syncSets={wiring.syncSets}
        countPending={wiring.countPending}
        startRest={wiring.startRest}
        clock={wiring.clock}
        wakeLock={wiring.wakeLock}
        cue={wiring.cue}
        push={wiring.push}
      />
    </div>
  )
}
