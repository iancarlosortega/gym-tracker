import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workoutsKeys } from '../../workouts/presentation/queries'
import {
  archiveEquipment,
  createEquipment,
  getCatalogEquipment,
  getEquipmentUsage,
  type NewEquipment,
  renameEquipment,
} from '../infrastructure/equipment.api'
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
  equipment: () => [...catalogKeys.all, 'equipment'] as const,
  usage: (equipmentId: string) => [...catalogKeys.equipment(), equipmentId, 'usage'] as const,
}

export const catalogExercisesQuery = () =>
  queryOptions({ queryKey: catalogKeys.exercises(), queryFn: () => getCatalogExercises() })

/** Every exercise, archived ones included. Pickers use `useExercises`, which leaves them out. */
export const useCatalogExercises = () => useQuery(catalogExercisesQuery())

/** A change to one catalog item is a change to every list that names it. */
const useCatalogMutation = <TVariables>(
  write: (variables: TVariables) => Promise<unknown>,
  affected: readonly (readonly string[])[],
) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: write,
    onSuccess: async () => {
      await Promise.all(affected.map((queryKey) => client.invalidateQueries({ queryKey })))
    },
  })
}

const exerciseLists = [catalogKeys.exercises(), workoutsKeys.exercises()]
const equipmentLists = [catalogKeys.equipment(), workoutsKeys.equipment()]

export const useCreateExercise = () =>
  useCatalogMutation((exercise: NewExercise) => createExercise(exercise), exerciseLists)

export const useRenameExercise = () =>
  useCatalogMutation(
    ({ id, name }: { id: string; name: string }) => renameExercise(id, name),
    exerciseLists,
  )

export const useArchiveExercise = () =>
  useCatalogMutation((id: string) => archiveExercise(id), exerciseLists)

export const catalogEquipmentQuery = () =>
  queryOptions({ queryKey: catalogKeys.equipment(), queryFn: () => getCatalogEquipment() })

export const useCatalogEquipment = () => useQuery(catalogEquipmentQuery())

export const useEquipmentUsage = (equipmentId: string) =>
  useQuery({
    queryKey: catalogKeys.usage(equipmentId),
    queryFn: () => getEquipmentUsage(equipmentId),
  })

export const useRenameEquipment = () =>
  useCatalogMutation(
    ({ id, name }: { id: string; name: string }) => renameEquipment(id, name),
    equipmentLists,
  )

export const useArchiveEquipment = () =>
  useCatalogMutation((id: string) => archiveEquipment(id), equipmentLists)

export const useCreateEquipment = () =>
  useCatalogMutation((equipment: NewEquipment) => createEquipment(equipment), equipmentLists)
