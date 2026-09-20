'use client'

import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import {
  LoadEntry,
  type MeasurementMode,
} from '@gym/domain/measurement/value-objects/load-entry.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import type { CompletionCue } from '@gym/domain/rest-timer/ports/completion-cue.port'
import type { ScreenWakeLock } from '@gym/domain/rest-timer/ports/screen-wake-lock.port'
import type { RestInterval } from '@gym/domain/rest-timer/value-objects/rest-interval.vo'
import { useCallback, useEffect, useState } from 'react'
import type { HttpPushGateway } from '../../../push/infrastructure/http-push.gateway'
import type { StartRestUseCase } from '../../../rest-timer/application/start-rest.use-case'
import { RestTimerContainer } from '../../../rest-timer/presentation/containers/rest-timer.container'
import type {
  EquipmentResponse,
  ExerciseResponse,
} from '../../../workouts/infrastructure/http-workout.gateway'
import type { CountPendingSetsUseCase } from '../../application/count-pending-sets.use-case'
import type { LogSetOfflineUseCase } from '../../application/log-set-offline.use-case'
import { QueueWriteFailedError } from '../../application/queue-write-failed.error'
import type { SyncPendingSetsUseCase } from '../../application/sync-pending-sets.use-case'
import { LoggedSetList, type LoggedSetRow } from '../components/logged-set-list'
import {
  type EquipmentOption,
  type ExerciseOption,
  SetEntryForm,
  type SetEntrySubmission,
} from '../components/set-entry-form'
import { SyncStatus } from '../components/sync-status'

export interface LogWorkoutContainerProps {
  readonly sessionId: string
  readonly exercises: readonly ExerciseResponse[]
  readonly equipment: readonly EquipmentResponse[]
  readonly logSet: LogSetOfflineUseCase
  readonly syncSets: SyncPendingSetsUseCase
  readonly countPending: CountPendingSetsUseCase
  readonly startRest: StartRestUseCase
  readonly clock: Clock
  readonly wakeLock: ScreenWakeLock
  readonly cue: CompletionCue
  /**
   * The rest the plan asks for after this exercise.
   *
   * Rest belongs to a routine's entry rather than to the exercise, so an ad
   * hoc workout has none to look up and falls back to the default.
   */
  readonly restSecondsFor?: (exerciseId: string) => number | undefined
  /**
   * Books the buzz that survives the app being closed.
   *
   * Optional: without it the foreground countdown still runs, which is the
   * guaranteed path either way.
   */
  readonly push?: HttpPushGateway
  readonly displayUnit?: 'KG' | 'LB'
}

interface RestingState {
  readonly interval: RestInterval
  readonly exerciseName: string
  readonly lastSet: string
  /** The set this rest follows; the server cancels the alert by it. */
  readonly setId: string
}

/**
 * The logging surface: state, wiring, and nothing drawn by hand.
 *
 * A logged set renders from the value the device resolved, not from a server
 * response, because the server may be a basement away. Synchronisation runs
 * when the browser says the network is back and once on mount, and its
 * failures are silent by design — the pending count is the honest signal.
 */
export const LogWorkoutContainer = ({
  sessionId,
  exercises,
  equipment,
  logSet,
  syncSets,
  countPending,
  startRest,
  clock,
  wakeLock,
  cue,
  restSecondsFor,
  push,
  displayUnit = 'KG',
}: LogWorkoutContainerProps) => {
  const [rows, setRows] = useState<readonly LoggedSetRow[]>([])
  const [pending, setPending] = useState(0)
  const [storageFailure, setStorageFailure] = useState<string | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [resting, setResting] = useState<RestingState | null>(null)

  const drain = useCallback(async () => {
    const result = await syncSets.execute()
    setPending(result.pending)
  }, [syncSets])

  useEffect(() => {
    void countPending.execute().then(setPending)
  }, [countPending])

  useEffect(() => {
    const onOnline = () => void drain()

    globalThis.addEventListener?.('online', onOnline)
    return () => globalThis.removeEventListener?.('online', onOnline)
  }, [drain])

  const submit = async (submission: SetEntrySubmission): Promise<void> => {
    const exercise = exercises.find((candidate) => candidate.id === submission.exerciseId)
    const chosen = equipment.find((candidate) => candidate.id === submission.equipmentId)

    if (exercise === undefined || chosen === undefined) {
      return
    }

    setBusy(true)
    setStorageFailure(undefined)

    try {
      const set = await logSet.execute({
        sessionId,
        exerciseId: exercise.id,
        equipmentId: chosen.id,
        entry: entryFor(exercise.defaultMode, submission.load, chosen.barKilograms),
        reps: submission.reps,
        loggedAt: new Date(),
        snapshot: {
          barGrams:
            exercise.defaultMode === 'PER_SIDE' && chosen.barKilograms !== null
              ? fromKilograms(chosen.barKilograms)
              : null,
          displayUnit,
          equipmentId: chosen.id,
        },
      })

      const row = toRow(set, exercise.name)
      setRows((current) => [row, ...current])
      setPending(await countPending.execute())
      void drain()

      // Rest begins the moment the set is down, not when the user asks.
      const interval = await startRest.execute({ seconds: restSecondsFor?.(exercise.id) })

      setResting({
        interval,
        exerciseName: exercise.name,
        lastSet: `${row.load} for ${row.reps} reps`,
        setId: set.id,
      })

      // A failed booking is not worth interrupting a workout for: the
      // countdown on screen is unaffected and is the guaranteed path.
      void push?.scheduleRestAlert(set.id, interval.endsAt).catch(() => undefined)
    } catch (failure) {
      if (failure instanceof QueueWriteFailedError) {
        setStorageFailure(failure.message)
        return
      }
      throw failure
    } finally {
      setBusy(false)
    }
  }

  /** Out of range is the button doing nothing, not an error mid-workout. */
  const adjustRest = (seconds: number): void => {
    setResting((current) => {
      if (current === null) {
        return current
      }

      try {
        return { ...current, interval: current.interval.adjustedBy(seconds) }
      } catch {
        return current
      }
    })
  }

  if (resting !== null) {
    return (
      <RestTimerContainer
        interval={resting.interval}
        exerciseName={resting.exerciseName}
        lastSet={resting.lastSet}
        clock={clock}
        wakeLock={wakeLock}
        cue={cue}
        onFinished={() => {
          void push?.cancelRestAlert(resting.setId).catch(() => undefined)
          setResting(null)
        }}
        onAdjust={adjustRest}
      />
    )
  }

  return (
    <section className="grid gap-6">
      <SyncStatus pending={pending} storageFailure={storageFailure} />
      <SetEntryForm
        exercises={exercises.map(toExerciseOption)}
        equipment={equipment.map(toEquipmentOption)}
        busy={busy}
        onSubmit={(submission) => void submit(submission)}
      />
      <LoggedSetList sets={rows} />
    </section>
  )
}

const entryFor = (mode: MeasurementMode, load: number, barKilograms: number | null): LoadEntry => {
  switch (mode) {
    case 'PER_SIDE':
      return LoadEntry.perSide(fromKilograms(load), fromKilograms(barKilograms ?? 0))
    case 'STACK_POSITION':
      return LoadEntry.stack(stackPosition(load))
    case 'TOTAL':
      return LoadEntry.total(fromKilograms(load))
  }
}

/**
 * A pin position is shown as a position and never as a weight.
 *
 * `mass()` answers not-applicable for an ordinal set, and this is the edge
 * where that answer has to survive into what the user reads.
 */
const toRow = (set: LoggedSet, exerciseName: string): LoggedSetRow => {
  const mass = set.mass()
  const state = set.entry.toJSON()

  return {
    id: set.id,
    exerciseName,
    load:
      mass.kind === 'resolved'
        ? `${mass.grams / 1000} kg`
        : `position ${state.mode === 'STACK_POSITION' ? state.position : '?'}`,
    reps: set.reps,
  }
}

const toExerciseOption = (exercise: ExerciseResponse): ExerciseOption => {
  return { id: exercise.id, name: exercise.name, defaultMode: exercise.defaultMode }
}

const toEquipmentOption = (item: EquipmentResponse): EquipmentOption => {
  return { id: item.id, name: item.name }
}
