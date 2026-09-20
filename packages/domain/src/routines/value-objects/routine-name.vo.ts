import { InvalidRoutineNameError } from '@domain/routines/errors.js'

const MAXIMUM_LENGTH = 120

export class RoutineName {
  private constructor(private readonly name: string) {
    Object.freeze(this)
  }

  static create(input: string): RoutineName {
    const trimmed = input.trim()

    if (trimmed.length === 0) {
      throw new InvalidRoutineNameError('A routine name cannot be empty.')
    }
    if (trimmed.length > MAXIMUM_LENGTH) {
      throw new InvalidRoutineNameError(
        `A routine name cannot be longer than ${MAXIMUM_LENGTH} characters.`,
      )
    }
    return new RoutineName(trimmed)
  }

  get value(): string {
    return this.name
  }

  equals(other: RoutineName): boolean {
    return this.name.toLowerCase() === other.value.toLowerCase()
  }
}
