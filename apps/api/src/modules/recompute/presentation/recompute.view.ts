import { grams, toKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import type { RecomputeDiff } from '@gym/domain/recompute/value-objects/recompute-diff.vo'

export interface SetChangeView {
  readonly setId: string
  readonly exerciseId: string
  readonly loggedAt: string
  readonly fromKilograms: number
  readonly toKilograms: number
}

export interface RecomputePreviewView {
  readonly equipmentId: string
  readonly affectedSets: number
  readonly changes: readonly SetChangeView[]
  readonly records: readonly {
    readonly exerciseId: string
    readonly fromKilograms: number
    readonly toKilograms: number
    readonly holderSetId: string
  }[]
  /** Send this back to apply exactly the change shown here. */
  readonly previewToken: string
}

export const toRecomputePreviewView = (diff: RecomputeDiff): RecomputePreviewView => ({
  equipmentId: diff.equipmentId,
  affectedSets: diff.changes.length,
  changes: diff.changes.map((change) => ({
    setId: change.setId,
    exerciseId: change.exerciseId,
    loggedAt: change.loggedAt.toISOString(),
    fromKilograms: toKilograms(grams(change.currentGrams)),
    toKilograms: toKilograms(grams(change.recomputedGrams)),
  })),
  records: diff.records.map((record) => ({
    exerciseId: record.exerciseId,
    fromKilograms: toKilograms(grams(record.currentGrams)),
    toKilograms: toKilograms(grams(record.recomputedGrams)),
    holderSetId: record.holderSetId,
  })),
  previewToken: diff.token,
})
