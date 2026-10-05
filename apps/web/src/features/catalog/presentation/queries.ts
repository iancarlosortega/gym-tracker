import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type CachePatch, optimisticMutation, patch } from '@/lib/optimistic'
import { workoutsKeys } from '../../workouts/presentation/queries'
import {
  archiveEquipment,
  correctBarWeight,
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
const useCatalogMutation = <TVariables, TResult>(
  write: (variables: TVariables) => Promise<TResult>,
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

interface CatalogItem {
  readonly id: string
  readonly name: string
  readonly archived: boolean
}

type Lists = readonly [catalog: readonly unknown[], pickers: readonly unknown[]]

/**
 * One item changed in both the catalog, which keeps archived items, and the
 * pickers, which leave them out.
 */
const patchItem = (
  [catalog, pickers]: Lists,
  id: string,
  change: { readonly name?: string; readonly archived?: true },
): readonly CachePatch[] => {
  const rewrite = (items: readonly CatalogItem[]) =>
    items.map((item) => (item.id === id ? { ...item, ...change } : item))

  return [
    patch<readonly CatalogItem[]>(catalog, rewrite),
    patch<readonly CatalogItem[]>(pickers, (items) =>
      rewrite(items).filter((item) => !item.archived),
    ),
  ]
}

const CATALOG_WRITE = [...catalogKeys.all, 'write'] as const

/** A rename or archive shown at once in every list that names the item. */
const useInstantCatalogWrite = <TVariables extends { readonly id: string }>(
  lists: Lists,
  write: (variables: TVariables) => Promise<unknown>,
  change: (variables: TVariables) => { readonly name?: string; readonly archived?: true },
) =>
  useMutation(
    optimisticMutation<TVariables, unknown>({
      mutationKey: CATALOG_WRITE,
      scope: 'catalog',
      mutationFn: write,
      patches: (variables) => patchItem(lists, variables.id, change(variables)),
      invalidates: lists,
    }),
  )

export const useCreateExercise = () =>
  useCatalogMutation((exercise: NewExercise) => createExercise(exercise), exerciseLists)

export const useRenameExercise = () =>
  useInstantCatalogWrite<{ id: string; name: string }>(
    [catalogKeys.exercises(), workoutsKeys.exercises()],
    ({ id, name }) => renameExercise(id, name),
    ({ name }) => ({ name }),
  )

export const useArchiveExercise = () =>
  useInstantCatalogWrite<{ id: string }>(
    [catalogKeys.exercises(), workoutsKeys.exercises()],
    ({ id }) => archiveExercise(id),
    () => ({ archived: true }),
  )

export const catalogEquipmentQuery = () =>
  queryOptions({ queryKey: catalogKeys.equipment(), queryFn: () => getCatalogEquipment() })

export const useCatalogEquipment = () => useQuery(catalogEquipmentQuery())

export const useEquipmentUsage = (equipmentId: string) =>
  useQuery({
    queryKey: catalogKeys.usage(equipmentId),
    queryFn: () => getEquipmentUsage(equipmentId),
  })

export const useRenameEquipment = () =>
  useInstantCatalogWrite<{ id: string; name: string }>(
    [catalogKeys.equipment(), workoutsKeys.equipment()],
    ({ id, name }) => renameEquipment(id, name),
    ({ name }) => ({ name }),
  )

export const useArchiveEquipment = () =>
  useInstantCatalogWrite<{ id: string }>(
    [catalogKeys.equipment(), workoutsKeys.equipment()],
    ({ id }) => archiveEquipment(id),
    () => ({ archived: true }),
  )

export const useCreateEquipment = () =>
  useCatalogMutation((equipment: NewEquipment) => createEquipment(equipment), equipmentLists)

export const useCorrectBarWeight = () =>
  useCatalogMutation(
    ({ id, barKilograms }: { id: string; barKilograms: number | null }) =>
      correctBarWeight(id, barKilograms),
    equipmentLists,
  )
