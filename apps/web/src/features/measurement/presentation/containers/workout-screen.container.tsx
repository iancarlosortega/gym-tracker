'use client'

import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import {
  LoadEntry,
  type MeasurementMode,
} from '@gym/domain/measurement/value-objects/load-entry.vo'
import { stackPosition } from '@gym/domain/measurement/value-objects/stack-position.vo'
import type { CompletionCue } from '@gym/domain/rest-timer/ports/completion-cue.port'
import type { ScreenWakeLock } from '@gym/domain/rest-timer/ports/screen-wake-lock.port'
import type { RestInterval } from '@gym/domain/rest-timer/value-objects/rest-interval.vo'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { type DisplayUnit, fromDisplay, spokenUnit, unitLabel } from '@/lib/units'
import { useDisplayUnit } from '../../../auth/presentation/queries'
import { NewEquipmentForm } from '../../../catalog/presentation/components/new-equipment-form'
import { useCreateEquipment } from '../../../catalog/presentation/queries'
import type { PushApi } from '../../../push/infrastructure/push.api'
import type { StartRestUseCase } from '../../../rest-timer/application/start-rest.use-case'
import { RestTimerContainer } from '../../../rest-timer/presentation/containers/rest-timer.container'
import type { RoutineEntryResponse } from '../../../routines/infrastructure/routines.api'
import { restLabel, targetLabel } from '../../../routines/presentation/components/routine-views'
import { elapsed } from '../../../shell/presentation/components/workout-mini-bar'
import type {
  EquipmentResponse,
  ExerciseResponse,
} from '../../../workouts/infrastructure/workouts.api'
import type { CountPendingSetsUseCase } from '../../application/count-pending-sets.use-case'
import type { LogSetOfflineUseCase } from '../../application/log-set-offline.use-case'
import { QueueWriteFailedError } from '../../application/queue-write-failed.error'
import type { SyncPendingSetsUseCase } from '../../application/sync-pending-sets.use-case'
import { SyncStatus } from '../components/sync-status'
import { keypadReducer, keypadValues, openKeypad } from '../keypad/keypad.reducer'
import { SetKeypad, ValueTile } from '../keypad/set-keypad'
import { useLastSets } from '../last-sets.queries'
import { sessionSetsQuery } from '../session-sets.queries'
import { type DoneSet, doneLabel, doneRowsFor, fromQueue } from '../workout/done-sets'
import { LastTimeCard, lastSetLabel } from '../workout/last-time-card'
import {
  compatibleEquipment,
  defaultEquipmentId,
  kindsFor,
  lastTimeState,
  logBlocker,
  workoutOrder,
} from '../workout/workout-plan'
import { DoneSets, ExerciseFocus, LogRow, WorkoutHeader } from '../workout/workout-views'

export interface WorkoutScreenProps {
  readonly sessionId: string
  readonly startedAt: Date
  /** The routine being followed; null for an empty workout or while it cannot be read. */
  readonly routine: {
    readonly name: string
    readonly entries: readonly RoutineEntryResponse[]
  } | null
  readonly exercises: readonly ExerciseResponse[]
  readonly equipment: readonly EquipmentResponse[]
  readonly queue: SetRepository
  readonly logSet: LogSetOfflineUseCase
  readonly syncSets: SyncPendingSetsUseCase
  readonly countPending: CountPendingSetsUseCase
  readonly startRest: StartRestUseCase
  readonly restSecondsFor: (exerciseId: string) => number
  readonly clock: Clock
  readonly wakeLock: ScreenWakeLock
  readonly cue: CompletionCue
  readonly push?: PushApi
  readonly finishing: boolean
  readonly onFinish: () => void
}

interface Resting {
  readonly interval: RestInterval
  readonly exerciseName: string
  readonly lastSet: string
  readonly setId: string
}

const weightTile = (mode: MeasurementMode, perHand: boolean, unit: DisplayUnit) => {
  const reading = { unit: unitLabel(unit), spokenUnit: spokenUnit(unit) }
  switch (mode) {
    case 'PER_SIDE':
      return { label: perHand ? 'Weight per hand' : 'Weight per side', ...reading }
    case 'STACK_POSITION':
      return { label: 'Pin position', unit: undefined, spokenUnit: undefined }
    case 'TOTAL':
      return { label: 'Weight', ...reading }
  }
}

/** Typed in the user's unit; a bar that is not counted stays null, never 0 kg. */
const entryFor = (
  mode: MeasurementMode,
  value: number,
  barKilograms: number | null,
  unit: DisplayUnit,
): LoadEntry => {
  switch (mode) {
    case 'PER_SIDE':
      return LoadEntry.perSide(
        fromDisplay(value, unit),
        barKilograms === null ? null : fromKilograms(barKilograms),
      )
    case 'STACK_POSITION':
      return LoadEntry.stack(stackPosition(value))
    case 'TOTAL':
      return LoadEntry.total(fromDisplay(value, unit))
  }
}

const useNow = (): Date => {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  return now
}

const NOTHING_DONE: readonly DoneSet[] = []

/**
 * The focus screen: one exercise at a time, values on tiles, the keypad only
 * while a tile is being edited.
 *
 * Sets go through the offline queue as before; the done list is rebuilt from
 * the queue and the server, so minimizing the workout loses nothing.
 */
export const WorkoutScreenContainer = ({
  sessionId,
  startedAt,
  routine,
  exercises,
  equipment,
  queue,
  logSet,
  syncSets,
  countPending,
  startRest,
  restSecondsFor,
  clock,
  wakeLock,
  cue,
  push,
  finishing,
  onFinish,
}: WorkoutScreenProps) => {
  const now = useNow()
  const unit = useDisplayUnit()
  const queryClient = useQueryClient()
  const doneKey = sessionSetsQuery(sessionId, queue).queryKey
  const done = useQuery(sessionSetsQuery(sessionId, queue)).data ?? NOTHING_DONE
  const [added, setAdded] = useState<readonly string[]>([])
  const [index, setIndex] = useState(0)
  const [chosenEquipment, setChosenEquipment] = useState<ReadonlyMap<string, string>>(new Map())
  const [sheet, setSheet] = useState<'equipment' | 'exercise' | null>(null)
  const [keypadOpen, setKeypadOpen] = useState(false)
  const [entry, dispatch] = useReducer(
    keypadReducer,
    openKeypad({ weight: '', reps: '' }, 'weight'),
  )
  const [pending, setPending] = useState(0)
  const [storageFailure, setStorageFailure] = useState<string | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [resting, setResting] = useState<Resting | null>(null)
  /** Each exercise keeps what was typed for it while the workout moves between them. */
  const [typed, setTyped] = useState<ReadonlyMap<string, { weight: string; reps: string }>>(
    new Map(),
  )
  const [created, setCreated] = useState<readonly EquipmentResponse[]>([])
  const [addingEquipment, setAddingEquipment] = useState(false)
  const createEquipment = useCreateEquipment()
  const allEquipment = useMemo(() => [...equipment, ...created], [equipment, created])

  /** The done list, from the server and whatever the phone still holds. */
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: doneKey })
    setPending(await countPending.execute())
  }, [queryClient, doneKey, countPending])

  const drain = useCallback(async () => {
    await syncSets.execute()
    await refresh()
  }, [syncSets, refresh])

  useEffect(() => {
    void countPending.execute().then(setPending)
  }, [countPending])

  useEffect(() => {
    const onOnline = () => void drain()
    globalThis.addEventListener?.('online', onOnline)
    return () => globalThis.removeEventListener?.('online', onOnline)
  }, [drain])

  const order = workoutOrder(routine?.entries ?? null, [
    ...done.map((set) => set.exerciseId),
    ...added,
  ])
  const exerciseId = order[Math.min(index, order.length - 1)] ?? null
  const exercise = exercises.find((candidate) => candidate.id === exerciseId) ?? null
  const planned = routine?.entries.find((candidate) => candidate.exerciseId === exerciseId) ?? null
  const rows = exerciseId === null ? [] : doneRowsFor(exerciseId, done, unit)
  const setNumber = rows.length + 1

  const compatible = useMemo(
    () => (exercise === null ? [] : compatibleEquipment(exercise.defaultMode, allEquipment)),
    [exercise, allEquipment],
  )
  const usedEarlier = [...done].reverse().find((set) => set.exerciseId === exerciseId)
  const equipmentId =
    (exerciseId !== null ? chosenEquipment.get(exerciseId) : undefined) ??
    defaultEquipmentId({
      planned: planned?.equipmentId ?? null,
      usedEarlier: usedEarlier?.equipmentId ?? null,
      compatible,
    })
  const chosen = compatible.find((item) => item.id === equipmentId) ?? null
  const perHand = exercise?.defaultMode === 'PER_SIDE' && chosen?.kind === 'FREE_WEIGHT'

  const lastRead = useLastSets(exerciseId ?? '', sessionId)
  const lastTime = lastTimeState(
    {
      data: exerciseId === null ? null : lastRead.data,
      offline: lastRead.fetchStatus === 'paused' || lastRead.isError,
    },
    setNumber,
  )
  const lastForSet = lastTime.kind === 'value' ? lastTime.set : null

  const values = keypadValues(entry)
  const blocker =
    exercise === null
      ? null
      : logBlocker({ equipment: chosen !== null, weight: values.weight, reps: values.reps })
  const canLog = exercise !== null && blocker === null && !busy

  const goTo = (next: number) => {
    const nextId = order[next]
    const remembered = new Map(typed)
    if (exerciseId !== null) remembered.set(exerciseId, { weight: entry.weight, reps: entry.reps })
    setTyped(remembered)
    setIndex(next)
    setKeypadOpen(false)
    dispatch({
      type: 'load',
      values: (nextId === undefined ? undefined : remembered.get(nextId)) ?? {
        weight: '',
        reps: '',
      },
    })
  }

  const log = async () => {
    if (!canLog || exercise === null || chosen === null || values.weight === null) return
    setBusy(true)
    setStorageFailure(undefined)
    try {
      const set = await logSet.execute({
        sessionId,
        exerciseId: exercise.id,
        equipmentId: chosen.id,
        entry: entryFor(exercise.defaultMode, values.weight, chosen.barKilograms, unit),
        reps: values.reps ?? 0,
        loggedAt: new Date(),
        snapshot: {
          barGrams:
            exercise.defaultMode === 'PER_SIDE' && chosen.barKilograms !== null
              ? fromKilograms(chosen.barKilograms)
              : null,
          displayUnit: unit,
          equipmentId: chosen.id,
        },
      })
      setKeypadOpen(false)
      const row = fromQueue(set)
      queryClient.setQueryData<readonly DoneSet[]>(doneKey, (current = []) => [...current, row])
      setPending(await countPending.execute())
      void drain()

      // Rest begins the moment the set is down, not when the user asks.
      const interval = await startRest.execute({ seconds: restSecondsFor(exercise.id) })
      setResting({
        interval,
        exerciseName: exercise.name,
        lastSet: doneLabel(row, unit),
        setId: set.id,
      })
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
        onAdjust={(seconds) =>
          setResting((current) => {
            if (current === null) return current
            try {
              return { ...current, interval: current.interval.adjustedBy(seconds) }
            } catch {
              // Out of range is the button doing nothing, not an error mid-workout.
              return current
            }
          })
        }
      />
    )
  }

  const tile = exercise === null ? null : weightTile(exercise.defaultMode, perHand, unit)
  const offered = exercises.filter(
    (candidate) => !candidate.archived && !order.includes(candidate.id),
  )

  return (
    <div className="grid gap-5 pb-4">
      <WorkoutHeader
        title={routine?.name ?? 'Workout'}
        elapsed={elapsed(startedAt, now)}
        finishing={finishing}
        onFinish={onFinish}
      />
      <SyncStatus pending={pending} storageFailure={storageFailure} />

      {exercise === null || tile === null ? (
        <div className="grid justify-items-center gap-3 py-10 text-center">
          <p className="text-muted-foreground">No exercise yet.</p>
          <Button className="min-h-touch" onClick={() => setSheet('exercise')}>
            <Plus className="size-5" />
            Add an exercise
          </Button>
        </div>
      ) : (
        <>
          <ExerciseFocus
            position={order.indexOf(exercise.id) + 1}
            count={order.length}
            plan={
              planned === null
                ? null
                : `${targetLabel(planned.targetSets, planned.targetReps)} · rest ${restLabel(planned.restSeconds)}`
            }
            name={exercise.name}
            done={rows.length}
            target={planned?.targetSets ?? null}
            equipmentName={chosen?.name ?? null}
            onPickEquipment={() => setSheet('equipment')}
          />

          {!keypadOpen && <LastTimeCard state={lastTime} unit={unit} perHand={perHand} />}

          <div className="grid grid-cols-2 gap-3">
            <ValueTile
              label={tile.label}
              value={entry.weight}
              unit={tile.unit}
              spokenUnit={tile.spokenUnit}
              hint={
                keypadOpen && lastForSet !== null ? `Last: ${lastSetLabel(lastForSet)}` : undefined
              }
              pressed={keypadOpen && entry.field === 'weight'}
              onPress={() => {
                setKeypadOpen(true)
                dispatch({ type: 'switchField', field: 'weight' })
              }}
            />
            <ValueTile
              label="Reps"
              value={entry.reps}
              pressed={keypadOpen && entry.field === 'reps'}
              onPress={() => {
                setKeypadOpen(true)
                dispatch({ type: 'switchField', field: 'reps' })
              }}
            />
          </div>

          <DoneSets rows={rows} />

          {keypadOpen ? (
            <SetKeypad
              state={entry}
              dispatch={dispatch}
              setNumber={setNumber}
              weightLabel={tile.label.toLowerCase()}
              last={
                lastForSet === null ? null : { weight: lastForSet.value, reps: lastForSet.reps }
              }
              onLog={() => void log()}
              onClose={() => setKeypadOpen(false)}
            />
          ) : (
            <div className="grid gap-2">
              <LogRow
                setNumber={setNumber}
                canLog={canLog}
                hasPrevious={index > 0}
                hasNext={index < order.length - 1}
                onLog={() => void log()}
                onPrevious={() => goTo(index - 1)}
                onNext={() => goTo(index + 1)}
              />
              {blocker !== null && (
                <p className="text-center text-muted-foreground text-sm">{blocker}</p>
              )}
              <Button variant="ghost" className="min-h-touch" onClick={() => setSheet('exercise')}>
                <Plus className="size-4" />
                Add an exercise
              </Button>
            </div>
          )}
        </>
      )}

      <Drawer
        open={sheet !== null}
        onOpenChange={(open) => {
          if (open) return
          setSheet(null)
          setAddingEquipment(false)
          createEquipment.reset()
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {sheet === 'equipment' ? 'Which equipment?' : 'Add an exercise'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="grid gap-3 px-4 pb-6">
            {sheet === 'equipment' && exercise !== null && tile !== null && (
              <>
                {compatible.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    Nothing you have can measure {tile.label.toLowerCase()} yet. Add it here.
                  </p>
                )}
                {(compatible.length === 0 || addingEquipment) && (
                  <NewEquipmentForm
                    kinds={kindsFor(exercise.defaultMode)}
                    unit={unit}
                    pending={createEquipment.isPending}
                    failed={createEquipment.isError}
                    onSubmit={(fresh) =>
                      createEquipment.mutate(fresh, {
                        onSuccess: (item) => {
                          setCreated((current) => [...current, item])
                          setChosenEquipment((current) =>
                            new Map(current).set(exercise.id, item.id),
                          )
                          setAddingEquipment(false)
                          setSheet(null)
                        },
                      })
                    }
                  />
                )}
              </>
            )}
            {(sheet === 'equipment' ? compatible : offered).length > 0 && !addingEquipment && (
              <ul className="grid gap-2">
                {(sheet === 'equipment' ? compatible : offered).map((option) => (
                  <li key={option.id}>
                    <Button
                      variant="outline"
                      className="min-h-touch w-full justify-start text-base"
                      onClick={() => {
                        if (sheet === 'equipment' && exerciseId !== null) {
                          setChosenEquipment((current) =>
                            new Map(current).set(exerciseId, option.id),
                          )
                        } else {
                          setAdded((current) => [...current, option.id])
                          goTo(order.length)
                        }
                        setSheet(null)
                      }}
                    >
                      {option.name}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {sheet === 'equipment' && compatible.length > 0 && !addingEquipment && (
              <Button
                variant="ghost"
                className="min-h-touch"
                onClick={() => setAddingEquipment(true)}
              >
                <Plus className="size-4" />
                New equipment
              </Button>
            )}
            {sheet === 'exercise' && offered.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Every exercise is already in this workout. Add more under Exercises.
              </p>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
