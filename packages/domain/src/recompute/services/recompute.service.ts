import type { Equipment } from '@domain/catalog/entities/equipment.entity.js'
import type { LoggedSet } from '@domain/measurement/entities/logged-set.entity.js'
import {
  addGrams,
  doubleGrams,
  type Grams,
  grams,
} from '@domain/measurement/value-objects/grams.vo.js'
import { isResolved } from '@domain/measurement/value-objects/mass-resolution.vo.js'
import type {
  PersonalRecordChange,
  RecomputeDiff,
  SetChange,
} from '@domain/recompute/value-objects/recompute-diff.vo.js'

/**
 * What correcting a piece of equipment would do to the history it touched.
 *
 * Computed, never applied. The whole point of the flow is that a user sees
 * the damage before agreeing to it: a bar that was recorded as twenty when
 * it was fifteen has been quietly inflating every per-side set for months,
 * and silently fixing them would replace one wrong history with another the
 * user never chose.
 *
 * Only PER_SIDE sets are in scope. A TOTAL set records the whole weight and
 * owes nothing to the bar; a STACK_POSITION set holds no mass at all, so
 * there is nothing in it to recompute.
 */
export const recomputeFor = (
  equipment: Equipment,
  sets: readonly LoggedSet[],
  tokenOf: (changes: readonly SetChange[]) => string,
): RecomputeDiff => {
  const barGrams = equipment.barGrams
  // Only the equipment being corrected. A set performed on another bar owes
  // nothing to this one, and rewriting it would corrupt history to fix history.
  const itsOwn = sets.filter((set) => set.equipmentId === equipment.id.value)
  const changes = barGrams === null ? [] : itsOwn.flatMap((set) => changeFor(set, barGrams))

  return {
    equipmentId: equipment.id.value,
    changes,
    records: recordChanges(sets, changes),
    token: tokenOf(changes),
  }
}

const changeFor = (set: LoggedSet, barGrams: Grams): SetChange[] => {
  const state = set.entry.toJSON()

  if (state.mode !== 'PER_SIDE' || set.equipmentId !== set.snapshot.equipmentId) {
    return []
  }

  const current = set.mass()
  const recomputed = addGrams(doubleGrams(state.perSideGrams), barGrams)

  if (!isResolved(current) || current.grams === recomputed) {
    return []
  }

  return [
    {
      setId: set.id,
      exerciseId: set.exerciseId,
      loggedAt: set.loggedAt,
      currentGrams: current.grams,
      recomputedGrams: recomputed,
    },
  ]
}

/**
 * Which personal records move, and to which set.
 *
 * Reported separately because a record is what the user remembers. A diff
 * that only counted sets would let a best lift change hands without anyone
 * being told, which is the one number nobody forgives being wrong.
 */
const recordChanges = (
  sets: readonly LoggedSet[],
  changes: readonly SetChange[],
): PersonalRecordChange[] => {
  const changeById = new Map(changes.map((change) => [change.setId, change]))
  const exerciseIds = [...new Set(changes.map((change) => change.exerciseId))]

  return exerciseIds.flatMap((exerciseId) => {
    const ofExercise = sets.filter((set) => set.exerciseId === exerciseId)

    const before = bestOf(ofExercise, (set) => currentGramsOf(set))
    const after = bestOf(
      ofExercise,
      (set) => changeById.get(set.id)?.recomputedGrams ?? currentGramsOf(set),
    )

    if (before === undefined || after === undefined || before.value === after.value) {
      return []
    }

    return [
      {
        exerciseId,
        currentGrams: before.value,
        recomputedGrams: after.value,
        holderSetId: after.setId,
      },
    ]
  })
}

const currentGramsOf = (set: LoggedSet): Grams => {
  const mass = set.mass()

  return isResolved(mass) ? mass.grams : grams(0)
}

const bestOf = (
  sets: readonly LoggedSet[],
  valueOf: (set: LoggedSet) => Grams,
): { readonly setId: string; readonly value: Grams } | undefined =>
  sets
    .map((set) => ({ setId: set.id, value: valueOf(set) }))
    .reduce<{ readonly setId: string; readonly value: Grams } | undefined>(
      (best, candidate) => (best === undefined || candidate.value > best.value ? candidate : best),
      undefined,
    )
