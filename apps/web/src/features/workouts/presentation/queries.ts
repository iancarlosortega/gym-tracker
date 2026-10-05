import {
  queryOptions,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  getCurrentWorkout,
  getEquipment,
  getExercises,
  startWorkout,
} from '../infrastructure/workouts.api'
import { offlineWork } from './offline-work'
import { openWorkout } from './open-workout'

export const workoutsKeys = {
  all: ['workouts'] as const,
  exercises: () => [...workoutsKeys.all, 'exercises'] as const,
  equipment: () => [...workoutsKeys.all, 'equipment'] as const,
  current: () => [...workoutsKeys.all, 'current'] as const,
  pendingSets: () => [...workoutsKeys.all, 'pending-sets'] as const,
  sessionSets: (sessionId: string) => [...workoutsKeys.all, 'session-sets', sessionId] as const,
  start: () => [...workoutsKeys.all, 'start'] as const,
}

export const exercisesQuery = () =>
  queryOptions({ queryKey: workoutsKeys.exercises(), queryFn: () => getExercises() })

/** Shared by every screen that names exercises, so a screen showing two lists asks once. */
export const useExercises = () => useQuery(exercisesQuery())

export const equipmentQuery = () =>
  queryOptions({ queryKey: workoutsKeys.equipment(), queryFn: () => getEquipment() })

export const useEquipment = () => useQuery(equipmentQuery())

export const currentWorkoutQuery = () =>
  queryOptions({
    queryKey: workoutsKeys.current(),
    queryFn: async () => openWorkout(await getCurrentWorkout(), await offlineWork().finishes.all()),
  })

/** The workout in progress, with a finish the phone has not sent yet already applied. */
export const useOpenWorkout = ({ enabled = true }: { readonly enabled?: boolean } = {}) =>
  useQuery({ ...currentWorkoutQuery(), enabled })

export const pendingSetsQuery = () =>
  queryOptions({
    queryKey: workoutsKeys.pendingSets(),
    queryFn: () => offlineWork().countPendingSets.execute(),
    // Read from the phone, so it must answer with no network.
    networkMode: 'always',
  })

/** How many logged sets the server has not confirmed yet. */
export const usePendingSetCount = () => useQuery(pendingSetsQuery())

/** Finish on the phone at once, then try to tell the server. */
export const useFinishWorkout = () => {
  const client = useQueryClient()

  return useMutation({
    // Local work: it must run with no network, where a mutation would pause.
    networkMode: 'always',
    mutationFn: async (sessionId: string) => {
      await offlineWork().finishOffline.execute(sessionId)
      void offlineWork().sync.execute()
    },
    onSuccess: () => client.invalidateQueries({ queryKey: workoutsKeys.all }),
  })
}

/**
 * Every start goes through here: a routine's plan, Home, the + menu and the
 * empty workout page.
 *
 * The server issues the workout, so it cannot be shown before it answers;
 * callers open the workout screen straight away instead, and that screen
 * reads the start in flight through `useStartingWorkout`.
 */
export const useStartWorkout = () => {
  const client = useQueryClient()

  return useMutation({
    mutationKey: workoutsKeys.start(),
    mutationFn: (routineId?: string) => startWorkout(routineId),
    // A read already in flight would otherwise answer "no workout" after this one exists.
    onMutate: () => client.cancelQueries({ queryKey: workoutsKeys.current() }),
    onSuccess: (session) => {
      client.setQueryData(workoutsKeys.current(), session)
      return client.invalidateQueries({ queryKey: workoutsKeys.all })
    },
  })
}

export interface StartingWorkout {
  readonly status: 'pending' | 'error'
  /** Waiting for a network before it can reach the server. */
  readonly offline: boolean
  readonly routineId: string | undefined
}

/** The most recent start, while it is in flight or once it has failed; null otherwise. */
export const useStartingWorkout = (): StartingWorkout | null => {
  const starts = useMutationState({
    filters: { mutationKey: workoutsKeys.start() },
    select: (mutation) => ({
      status: mutation.state.status,
      offline: mutation.state.isPaused,
      routineId: mutation.state.variables as string | undefined,
    }),
  })
  const latest = starts.at(-1)

  return latest?.status === 'pending' || latest?.status === 'error'
    ? { status: latest.status, offline: latest.offline, routineId: latest.routineId }
    : null
}
