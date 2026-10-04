import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workoutsKeys } from '../../workouts/presentation/queries'
import {
  archiveExercise,
  createExercise,
  getCatalogExercises,
  type NewExercise,
  renameExercise,
} from '../infrastructure/exercises.api'

export const catalogKeys = {
  all: ['catalog'] as const,
  exercises: () => [...catalogKeys.all, 'exercises'] as const,
}

export const catalogExercisesQuery = () =>
  queryOptions({ queryKey: catalogKeys.exercises(), queryFn: () => getCatalogExercises() })

/** Every exercise, archived ones included. Pickers use `useExercises`, which leaves them out. */
export const useCatalogExercises = () => useQuery(catalogExercisesQuery())

/** A change to one exercise is a change to every list that names it. */
const useExerciseMutation = <TVariables>(write: (variables: TVariables) => Promise<unknown>) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: write,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: catalogKeys.exercises() }),
        client.invalidateQueries({ queryKey: workoutsKeys.exercises() }),
      ])
    },
  })
}

export const useCreateExercise = () =>
  useExerciseMutation((exercise: NewExercise) => createExercise(exercise))

export const useRenameExercise = () =>
  useExerciseMutation(({ id, name }: { id: string; name: string }) => renameExercise(id, name))

export const useArchiveExercise = () => useExerciseMutation((id: string) => archiveExercise(id))
