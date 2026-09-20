import { InvalidExerciseNameError } from '@domain/catalog/errors.js'

const MAXIMUM_LENGTH = 120

/** The label a user gives an exercise. */
export class ExerciseName {
  private constructor(private readonly name: string) {
    Object.freeze(this)
  }

  static create(input: string): ExerciseName {
    const trimmed = input.trim()

    if (trimmed.length === 0) {
      throw new InvalidExerciseNameError('An exercise name cannot be empty.')
    }
    if (trimmed.length > MAXIMUM_LENGTH) {
      throw new InvalidExerciseNameError(
        `An exercise name cannot be longer than ${MAXIMUM_LENGTH} characters.`,
      )
    }

    return new ExerciseName(trimmed)
  }

  get value(): string {
    return this.name
  }

  /** Case-insensitive, so "Bench Press" and "bench press" are one exercise. */
  equals(other: ExerciseName): boolean {
    return this.name.toLowerCase() === other.value.toLowerCase()
  }

  toString(): string {
    return this.name
  }
}
