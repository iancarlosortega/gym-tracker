import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addRoutineExercise,
  archiveRoutine,
  changeRoutineEntry,
  createRoutine,
  type EntryTargets,
  getRoutine,
  getRoutines,
  removeRoutineEntry,
  renameRoutine,
  reorderRoutine,
} from '../infrastructure/routines.api'

export const routinesKeys = {
  all: ['routines'] as const,
  list: () => [...routinesKeys.all, 'list'] as const,
  detail: (routineId: string) => [...routinesKeys.all, 'detail', routineId] as const,
}

export const routinesQuery = () =>
  queryOptions({ queryKey: routinesKeys.list(), queryFn: () => getRoutines() })

export const useRoutines = () => useQuery(routinesQuery())

export const useRoutine = (routineId: string) =>
  useQuery({ queryKey: routinesKeys.detail(routineId), queryFn: () => getRoutine(routineId) })

/** Any write to a routine can change both the list and its plan. */
const useRoutineMutation = <TVariables, TResult>(
  write: (variables: TVariables) => Promise<TResult>,
) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: write,
    onSuccess: () => client.invalidateQueries({ queryKey: routinesKeys.all }),
  })
}

export const useCreateRoutine = () => useRoutineMutation((name: string) => createRoutine(name))

export const useRenameRoutine = () =>
  useRoutineMutation(({ id, name }: { id: string; name: string }) => renameRoutine(id, name))

export const useArchiveRoutine = () => useRoutineMutation((id: string) => archiveRoutine(id))

export const useAddRoutineExercise = (routineId: string) =>
  useRoutineMutation((exerciseId: string) => addRoutineExercise(routineId, { exerciseId }))

export const useChangeRoutineEntry = (routineId: string) =>
  useRoutineMutation(({ entryId, targets }: { entryId: string; targets: EntryTargets }) =>
    changeRoutineEntry(routineId, entryId, targets),
  )

export const useRemoveRoutineEntry = (routineId: string) =>
  useRoutineMutation((entryId: string) => removeRoutineEntry(routineId, entryId))

export const useReorderRoutine = (routineId: string) =>
  useRoutineMutation((entryIds: readonly string[]) => reorderRoutine(routineId, entryIds))
