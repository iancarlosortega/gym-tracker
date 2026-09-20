import {
  EquipmentCannotMeasureThatWayError,
  InvalidEquipmentNameError,
} from '@domain/catalog/errors.js'
import { EquipmentName } from '@domain/catalog/value-objects/equipment-name.vo.js'
import type { Grams } from '@domain/measurement/value-objects/grams.vo.js'
import type { MeasurementMode } from '@domain/measurement/value-objects/load-entry.vo.js'
import type { StackPosition } from '@domain/measurement/value-objects/stack-position.vo.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'

export const EQUIPMENT_KINDS = ['BARBELL', 'STACK', 'FREE_WEIGHT'] as const

export type EquipmentKind = (typeof EQUIPMENT_KINDS)[number]

/**
 * What a kind of equipment is made of.
 *
 * A discriminated union kept private to the class, so a barbell cannot hold a
 * stack size and a stack cannot hold a bar weight. The alternative — two
 * nullable columns and a comment — is how a machine ends up claiming a 20 kg
 * bar it does not have.
 */
type EquipmentSpec =
  | { readonly kind: 'BARBELL'; readonly barGrams: Grams }
  | { readonly kind: 'STACK'; readonly positions: number }
  | { readonly kind: 'FREE_WEIGHT' }

export interface CreateEquipmentInput {
  readonly userId: Id
  readonly name: string
  readonly kind: EquipmentKind
  readonly barGrams?: Grams | undefined
  readonly stackPositions?: number | undefined
  readonly createdAt?: Date | undefined
}

export interface EquipmentProps {
  readonly id: Id
  readonly userId: Id
  readonly name: EquipmentName
  readonly spec: EquipmentSpec
  readonly archivedOn: Date | null
  readonly createdAt: Date
}

export class Equipment {
  private constructor(private readonly props: EquipmentProps) {
    Object.freeze(this)
  }

  static create(input: CreateEquipmentInput): Equipment {
    return new Equipment({
      id: Id.create(),
      userId: input.userId,
      name: EquipmentName.create(input.name),
      spec: Equipment.specFrom(input),
      archivedOn: null,
      createdAt: new Date(input.createdAt ?? Date.now()),
    })
  }

  static restore(props: EquipmentProps): Equipment {
    return new Equipment({
      ...props,
      archivedOn: props.archivedOn === null ? null : new Date(props.archivedOn),
      createdAt: new Date(props.createdAt),
    })
  }

  /**
   * A barbell without a bar weight could never resolve a per-side entry, and a
   * stack without a position count could never check one. Both are refused at
   * creation rather than discovered when a set is logged.
   */
  private static specFrom(input: CreateEquipmentInput): EquipmentSpec {
    if (input.kind === 'BARBELL') {
      if (input.barGrams === undefined) {
        throw new InvalidEquipmentNameError(
          'A barbell must declare its bar weight, or a per-side entry could never resolve.',
        )
      }
      return { kind: 'BARBELL', barGrams: input.barGrams }
    }

    if (input.kind === 'STACK') {
      const positions = input.stackPositions
      if (positions === undefined || !Number.isInteger(positions) || positions < 1) {
        throw new InvalidEquipmentNameError(
          'A stack must declare how many positions it has, as a whole number of 1 or more.',
        )
      }
      return { kind: 'STACK', positions }
    }

    return { kind: 'FREE_WEIGHT' }
  }

  get id(): Id {
    return this.props.id
  }

  get userId(): Id {
    return this.props.userId
  }

  get name(): EquipmentName {
    return this.props.name
  }

  get kind(): EquipmentKind {
    return this.props.spec.kind
  }

  get barGrams(): Grams | null {
    return this.props.spec.kind === 'BARBELL' ? this.props.spec.barGrams : null
  }

  get stackPositions(): number | null {
    return this.props.spec.kind === 'STACK' ? this.props.spec.positions : null
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt)
  }

  get archivedOn(): Date | null {
    return this.props.archivedOn === null ? null : new Date(this.props.archivedOn)
  }

  get isArchived(): boolean {
    return this.props.archivedOn !== null
  }

  /**
   * Whether this equipment can honestly express that measurement mode.
   *
   * A barbell is loaded per side or read as a total; a stack only has
   * positions; a dumbbell has neither sides nor a stack. Pairing an exercise
   * with equipment that cannot express its mode would produce a set nobody
   * can interpret later.
   */
  supports(mode: MeasurementMode): boolean {
    switch (this.kind) {
      case 'BARBELL':
        return mode === 'PER_SIDE' || mode === 'TOTAL'
      case 'STACK':
        return mode === 'STACK_POSITION'
      case 'FREE_WEIGHT':
        return mode === 'TOTAL'
    }
  }

  allowsPosition(position: StackPosition): boolean {
    return this.props.spec.kind === 'STACK' && position <= this.props.spec.positions
  }

  withBarWeight(barGrams: Grams): Equipment {
    if (this.props.spec.kind !== 'BARBELL') {
      throw new EquipmentCannotMeasureThatWayError(
        'Only a barbell has a bar weight; this equipment has none to correct.',
      )
    }
    return new Equipment({ ...this.props, spec: { kind: 'BARBELL', barGrams } })
  }

  renamedTo(name: string): Equipment {
    return new Equipment({ ...this.props, name: EquipmentName.create(name) })
  }

  /** Archiving hides equipment from routine building; sets logged with it keep resolving. */
  archivedAt(instant: Date): Equipment {
    return new Equipment({ ...this.props, archivedOn: new Date(instant) })
  }

  unarchived(): Equipment {
    return new Equipment({ ...this.props, archivedOn: null })
  }

  equals(other: Equipment): boolean {
    return this.props.id.equals(other.id)
  }
}
