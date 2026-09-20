import { InvalidTargetRepsError } from '@domain/routines/errors.js'

const MAXIMUM_REPS = 100

/**
 * The repetition range an entry aims for.
 *
 * A range rather than a number, because a plan is "8 to 12", and collapsing
 * that to a single figure makes every set look like a miss.
 */
export class TargetReps {
  private constructor(
    private readonly lowest: number,
    private readonly highest: number,
  ) {
    Object.freeze(this)
  }

  static create(minimum: number, maximum: number = minimum): TargetReps {
    for (const value of [minimum, maximum]) {
      if (!Number.isInteger(value) || value < 1 || value > MAXIMUM_REPS) {
        throw new InvalidTargetRepsError(
          `A repetition target must be a whole number between 1 and ${MAXIMUM_REPS}, received ${value}.`,
        )
      }
    }
    if (maximum < minimum) {
      throw new InvalidTargetRepsError('A repetition range cannot end below where it starts.')
    }

    return new TargetReps(minimum, maximum)
  }

  get minimum(): number {
    return this.lowest
  }

  get maximum(): number {
    return this.highest
  }

  get isExact(): boolean {
    return this.lowest === this.highest
  }

  includes(reps: number): boolean {
    return reps >= this.lowest && reps <= this.highest
  }

  toString(): string {
    return this.isExact ? `${this.lowest}` : `${this.lowest}-${this.highest}`
  }
}
