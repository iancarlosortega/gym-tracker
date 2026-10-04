import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentWorkout, getEquipment, getExercises } from '../infrastructure/workouts.api'
import { offlineWork } from './offline-work'
import { openWorkout } from './open-workout'

export const workoutsKeys = {
  all: ['workouts'] as const,
  exercises: () => [...workoutsKeys.all, 'exercises'] as const,
  equipment: () => [...workoutsKeys.all, 'equipment'] as const,
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
    queryKey: [...workoutsKeys.all, 'current'] as const,
    queryFn: async () => openWorkout(await getCurrentWorkout(), await offlineWork().finishes.all()),
  })

/** The workout in progress, with a finish the phone has not sent yet already applied. */
export const useOpenWorkout = () => useQuery(currentWorkoutQuery())

export const pendingSetsQuery = () =>
  queryOptions({
    queryKey: [...workoutsKeys.all, 'pending-sets'] as const,
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
