import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type CachePatch, optimisticMutation, patch } from '@/lib/optimistic'
import {
  addRoutineExercise,
  archiveRoutine,
  changeRoutineEntry,
  createRoutine,
  type EntryTargets,
  getRoutine,
  getRoutines,
  type RoutineListing,
  type RoutineResponse,
  removeRoutineEntry,
  renameRoutine,
  reorderRoutine,
  reorderRoutines,
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

/** Shared by every instant routine write, so only the last one pending refetches. */
const ROUTINE_WRITE = [...routinesKeys.all, 'write'] as const

/** One routine rewritten the same way in its plan and in the list. */
const patchRoutine = (
  routineId: string,
  update: <T extends RoutineResponse>(routine: T) => T,
): readonly CachePatch[] => [
  patch<RoutineResponse>(routinesKeys.detail(routineId), update),
  patch<RoutineListing>(routinesKeys.list(), (listing) => ({
    ...listing,
    routines: listing.routines.map((routine) =>
      routine.id === routineId ? update(routine) : routine,
    ),
  })),
]

/** A write shown at once in the plan and the list, then confirmed by a refetch of both. */
const useInstantRoutineWrite = <TVariables>(
  scope: string,
  write: (variables: TVariables) => Promise<unknown>,
  patches: (variables: TVariables) => readonly CachePatch[],
) =>
  useMutation(
    optimisticMutation<TVariables, unknown>({
      mutationKey: ROUTINE_WRITE,
      scope,
      mutationFn: write,
      patches,
      invalidates: [routinesKeys.all],
    }),
  )

/** How the API spells a target: "8-12" for a range, "8" for an exact count. */
export const targetRepsText = (min: number | undefined, max: number | undefined): string | null => {
  if (min === undefined && max === undefined) {
    return null
  }
  if (min === undefined || max === undefined || min === max) {
    return String(min ?? max)
  }
  return `${min}-${max}`
}

export const useCreateRoutine = () => useRoutineMutation((name: string) => createRoutine(name))

export const useRenameRoutine = () =>
  useInstantRoutineWrite<{ id: string; name: string }>(
    'routine',
    ({ id, name }) => renameRoutine(id, name),
    ({ id, name }) => patchRoutine(id, (routine) => ({ ...routine, name })),
  )

export const useArchiveRoutine = () =>
  useInstantRoutineWrite<string>(
    'routine',
    (id) => archiveRoutine(id),
    (id) => patchRoutine(id, (routine) => ({ ...routine, archived: true })),
  )

/** Adding needs the entry id the server issues, so it waits for the answer. */
export const useAddRoutineExercise = (routineId: string) =>
  useRoutineMutation((exerciseId: string) => addRoutineExercise(routineId, { exerciseId }))

export const useChangeRoutineEntry = (routineId: string) =>
  useInstantRoutineWrite<{ entryId: string; targets: EntryTargets }>(
    `routine-entries:${routineId}`,
    ({ entryId, targets }) => changeRoutineEntry(routineId, entryId, targets),
    ({ entryId, targets }) =>
      patchRoutine(routineId, (routine) => ({
        ...routine,
        entries: routine.entries.map((entry) =>
          entry.id === entryId
            ? {
                ...entry,
                targetSets: targets.targetSets ?? entry.targetSets,
                targetReps:
                  targetRepsText(targets.targetRepsMin, targets.targetRepsMax) ?? entry.targetReps,
                restSeconds: targets.restSeconds ?? entry.restSeconds,
              }
            : entry,
        ),
      })),
  )

export const useRemoveRoutineEntry = (routineId: string) =>
  useInstantRoutineWrite<string>(
    `routine-entries:${routineId}`,
    (entryId) => removeRoutineEntry(routineId, entryId),
    (entryId) =>
      patchRoutine(routineId, (routine) => ({
        ...routine,
        entries: routine.entries.filter((entry) => entry.id !== entryId),
      })),
  )

export const useReorderRoutine = (routineId: string) =>
  useInstantRoutineWrite<readonly string[]>(
    `routine-entries:${routineId}`,
    (entryIds) => reorderRoutine(routineId, entryIds),
    (entryIds) =>
      patchRoutine(routineId, (routine) => ({
        ...routine,
        entries: entryIds.flatMap((id, position) => {
          const entry = routine.entries.find((candidate) => candidate.id === id)
          return entry === undefined ? [] : [{ ...entry, position }]
        }),
      })),
  )

/**
 * The user's own routine order, shown on the tap or the drop.
 *
 * `routineIds` names every active routine; archived ones keep their place
 * after them, out of sight.
 */
export const useReorderRoutines = () =>
  useInstantRoutineWrite<readonly string[]>(
    'routine-order',
    (routineIds) => reorderRoutines(routineIds),
    (routineIds) => [
      patch<RoutineListing>(routinesKeys.list(), (listing) => ({
        ...listing,
        routines: [
          ...routineIds.flatMap((id, position) => {
            const routine = listing.routines.find((candidate) => candidate.id === id)
            return routine === undefined ? [] : [{ ...routine, position }]
          }),
          ...listing.routines.filter((routine) => !routineIds.includes(routine.id)),
        ],
      })),
    ],
  )
