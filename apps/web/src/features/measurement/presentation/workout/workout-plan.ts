import type { MeasurementMode } from '@gym/domain/measurement/value-objects/load-entry.vo'
import type { EquipmentResponse } from '../../../workouts/infrastructure/workouts.api'
import type { LastSetsResponse } from '../../infrastructure/last-sets.api'

/** What each kind of equipment can measure, as the domain's `Equipment.supports` says. */
const SUPPORTS: Record<string, readonly MeasurementMode[]> = {
  BARBELL: ['PER_SIDE', 'TOTAL'],
  STACK: ['STACK_POSITION'],
  FREE_WEIGHT: ['TOTAL'],
}

export const compatibleEquipment = (
  mode: MeasurementMode,
  equipment: readonly EquipmentResponse[],
): EquipmentResponse[] =>
  equipment.filter((item) => !item.archived && (SUPPORTS[item.kind] ?? []).includes(mode))

/**
 * The equipment a set goes on unless the user picks another: the plan's, then
 * what this workout already used, then the only one that fits. When several
 * fit and nothing says which, the user chooses.
 */
export const defaultEquipmentId = ({
  planned,
  usedEarlier,
  compatible,
}: {
  readonly planned: string | null
  readonly usedEarlier: string | null
  readonly compatible: readonly EquipmentResponse[]
}): string | null => {
  const fits = (id: string | null) => id !== null && compatible.some((item) => item.id === id)
  if (fits(planned)) return planned
  if (fits(usedEarlier)) return usedEarlier
  return compatible.length === 1 ? (compatible[0]?.id ?? null) : null
}

/** The routine's order, then anything logged outside it in the order it was added. */
export const workoutOrder = (
  plan: readonly { readonly exerciseId: string; readonly position: number }[] | null,
  added: readonly string[],
): string[] => {
  const planned = [...(plan ?? [])]
    .sort((left, right) => left.position - right.position)
    .map((entry) => entry.exerciseId)
  return [...new Set([...planned, ...added])]
}

export type LastSet = LastSetsResponse['sets'][number]

export type LastTimeState =
  | { readonly kind: 'value'; readonly set: LastSet }
  | { readonly kind: 'no-set'; readonly setNumber: number }
  | { readonly kind: 'none' }
  | { readonly kind: 'offline' }
  | { readonly kind: 'loading' }

/** Undefined data means nothing was read yet; null means the exercise was never done. */
export const lastTimeState = (
  read: { readonly data: LastSetsResponse | null | undefined; readonly offline: boolean },
  setNumber: number,
): LastTimeState => {
  if (read.data === undefined) return read.offline ? { kind: 'offline' } : { kind: 'loading' }
  if (read.data === null) return { kind: 'none' }
  const set = read.data.sets.find((candidate) => candidate.setNumber === setNumber)
  return set === undefined ? { kind: 'no-set', setNumber } : { kind: 'value', set }
}
