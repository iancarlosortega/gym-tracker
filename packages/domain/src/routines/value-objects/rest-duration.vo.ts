import { InvalidRestDurationError } from '@domain/routines/errors.js'

const MAXIMUM_SECONDS = 3600

/** How long to rest after a set, in whole seconds. */
export class RestDuration {
  private constructor(private readonly seconds: number) {
    Object.freeze(this)
  }

  static create(seconds: number): RestDuration {
    if (!Number.isInteger(seconds) || seconds < 1) {
      throw new InvalidRestDurationError(
        `A rest duration must be a whole number of seconds, 1 or more, received ${seconds}.`,
      )
    }
    if (seconds > MAXIMUM_SECONDS) {
      throw new InvalidRestDurationError('A rest duration cannot exceed an hour.')
    }
    return new RestDuration(seconds)
  }

  /** Three minutes, which is what most compound lifts get. */
  static default(): RestDuration {
    return new RestDuration(180)
  }

  get value(): number {
    return this.seconds
  }

  equals(other: RestDuration): boolean {
    return this.seconds === other.value
  }
}
