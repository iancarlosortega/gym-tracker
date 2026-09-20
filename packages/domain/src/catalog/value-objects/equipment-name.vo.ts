import { InvalidEquipmentNameError } from '@domain/catalog/errors.js'

const MAXIMUM_LENGTH = 120

/** The label a user gives a piece of equipment. */
export class EquipmentName {
  private constructor(private readonly name: string) {
    Object.freeze(this)
  }

  static create(input: string): EquipmentName {
    const trimmed = input.trim()

    if (trimmed.length === 0) {
      throw new InvalidEquipmentNameError('An equipment name cannot be empty.')
    }
    if (trimmed.length > MAXIMUM_LENGTH) {
      throw new InvalidEquipmentNameError(
        `An equipment name cannot be longer than ${MAXIMUM_LENGTH} characters.`,
      )
    }

    return new EquipmentName(trimmed)
  }

  get value(): string {
    return this.name
  }

  equals(other: EquipmentName): boolean {
    return this.name.toLowerCase() === other.value.toLowerCase()
  }

  toString(): string {
    return this.name
  }
}
