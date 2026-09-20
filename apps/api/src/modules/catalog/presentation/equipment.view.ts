import type { Equipment } from '@gym/domain/catalog/entities/equipment.entity'
import { toKilograms } from '@gym/domain/measurement/value-objects/grams.vo'

/**
 * What a piece of equipment looks like over the wire.
 *
 * Bar weight is sent in kilograms because that is what a client shows; grams
 * are the domain's canonical unit and stay inside it.
 */
export interface EquipmentView {
  readonly id: string
  readonly name: string
  readonly kind: string
  readonly barKilograms: number | null
  readonly stackPositions: number | null
  readonly archived: boolean
}

export function toEquipmentView(model: Equipment): EquipmentView {
  const bar = model.barGrams

  return {
    id: model.id.value,
    name: model.name.value,
    kind: model.kind,
    barKilograms: bar === null ? null : toKilograms(bar),
    stackPositions: model.stackPositions,
    archived: model.isArchived,
  }
}
