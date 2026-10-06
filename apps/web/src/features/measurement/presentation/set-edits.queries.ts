import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { useMutation } from '@tanstack/react-query'
import { optimisticMutation, patch } from '@/lib/optimistic'
import type { DisplayUnit } from '@/lib/units'
import { historyKeys } from '../../history/presentation/history.queries'
import { statisticsKeys } from '../../statistics/presentation/queries'
import { workoutsKeys } from '../../workouts/presentation/queries'
import { correctSet, deleteSet } from '../infrastructure/sets.api'
import { lastSetsKeys } from './last-sets.queries'
import { correctionFor } from './set-entry'
import type { DoneSet } from './workout/done-sets'

export interface SetCorrectionInput {
  readonly set: DoneSet
  /** Typed in the user's unit: per side for PER_SIDE, the pin for a stack set. */
  readonly value: number
  readonly reps: number
  readonly unit: DisplayUnit
}

const SET_EDIT = ['set-edit'] as const

const invalidatesFor = (sessionId: string) => [
  workoutsKeys.sessionSets(sessionId),
  workoutsKeys.pendingSets(),
  workoutsKeys.current(),
  statisticsKeys.all,
  lastSetsKeys.all,
  historyKeys.all,
]

/** The row as it will read once saved: a per-side change moves both sides. */
const corrected = (set: DoneSet, input: SetCorrectionInput): DoneSet => {
  const load = correctionFor(set.mode, input.value, input.unit)

  if ('position' in load) {
    return { ...set, position: load.position, reps: input.reps }
  }

  const grams =
    set.mode === 'PER_SIDE' && set.grams !== null && set.rawGrams !== null
      ? set.grams + 2 * (load.grams - set.rawGrams)
      : load.grams
  return { ...set, grams, rawGrams: load.grams, reps: input.reps }
}

const patchSessionSets = (sessionId: string, update: (sets: readonly DoneSet[]) => DoneSet[]) =>
  patch<readonly DoneSet[]>(workoutsKeys.sessionSets(sessionId), update)

/**
 * Fix a logged set's load and reps, shown at once.
 *
 * A set still in the phone's queue is rewritten there, so only the corrected
 * one is ever sent. A set the server already has is corrected on the server,
 * and put back where it was if that fails.
 */
export const useCorrectSet = (sessionId: string, queue: SetRepository) =>
  useMutation(
    optimisticMutation<SetCorrectionInput, unknown>({
      mutationKey: SET_EDIT,
      scope: 'set-edit',
      mutationFn: async (input) => {
        const load = correctionFor(input.set.mode, input.value, input.unit)
        const queued = input.set.pending
          ? await queue.findOne(Criteria.create({ id: input.set.id }))
          : null

        if (queued !== null) {
          await queue.save(queued.correct({ load, reps: reps(input.reps) }))
          return
        }
        await correctSet(input.set.id, { ...load, reps: input.reps })
      },
      patches: (input) => [
        patchSessionSets(sessionId, (sets) =>
          sets.map((set) => (set.id === input.set.id ? corrected(set, input) : set)),
        ),
      ],
      invalidates: invalidatesFor(sessionId),
    }),
  )

/** Remove a set logged by mistake, shown at once; a queued one is simply never sent. */
export const useDeleteSet = (sessionId: string, queue: SetRepository) =>
  useMutation(
    optimisticMutation<DoneSet, unknown>({
      mutationKey: SET_EDIT,
      scope: 'set-edit',
      mutationFn: async (set) => {
        const queued = set.pending ? await queue.findOne(Criteria.create({ id: set.id })) : null

        if (queued !== null) {
          await queue.delete(set.id)
          return
        }
        await deleteSet(set.id)
      },
      patches: (set) => [
        patchSessionSets(sessionId, (sets) => sets.filter((other) => other.id !== set.id)),
      ],
      invalidates: invalidatesFor(sessionId),
    }),
  )
