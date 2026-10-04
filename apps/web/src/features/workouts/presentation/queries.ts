import { queryOptions, useQuery } from '@tanstack/react-query'
import { getExercises } from '../infrastructure/workouts.api'

export const workoutsKeys = {
  all: ['workouts'] as const,
  exercises: () => [...workoutsKeys.all, 'exercises'] as const,
}

export const exercisesQuery = () =>
  queryOptions({ queryKey: workoutsKeys.exercises(), queryFn: () => getExercises() })

/** Shared by every screen that names exercises, so a screen showing two lists asks once. */
export const useExercises = () => useQuery(exercisesQuery())
