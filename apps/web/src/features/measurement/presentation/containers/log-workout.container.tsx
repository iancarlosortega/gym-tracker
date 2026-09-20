'use client'

import type { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import {
  LoadEntry,
  type MeasurementMode,
} from '@gym/domain/measurement/value-objects/load-entry.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import { useCallback, useEffect, useState } from 'react'
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
  readonly displayUnit?: 'KG' | 'LB'
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
  displayUnit = 'KG',
}: LogWorkoutContainerProps) => {
  const [rows, setRows] = useState<readonly LoggedSetRow[]>([])
  const [pending, setPending] = useState(0)
  const [storageFailure, setStorageFailure] = useState<string | undefined>(undefined)
  const [busy, setBusy] = useState(false)

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

      setRows((current) => [toRow(set, exercise.name), ...current])
      setPending(await countPending.execute())
      void drain()
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

  return (
    <section>
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
