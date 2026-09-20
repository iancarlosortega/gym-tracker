import { RestDuration } from '@domain/routines/value-objects/rest-duration.vo.js'

export interface RestIntervalProps {
  readonly duration: RestDuration
  readonly startedAt: Date
}

/**
 * One rest between two sets: when it began and how long it is meant to last.
 *
 * It holds no countdown of its own. A value object that ticked would be a
 * different value every second and impossible to compare, so the remaining
 * time is asked for at an instant the caller supplies — which is also what
 * makes it testable without waiting three minutes.
 */
export class RestInterval {
  private constructor(
    private readonly duration: RestDuration,
    private readonly begunAt: Date,
  ) {
    Object.freeze(this)
  }

  static start(props: RestIntervalProps): RestInterval {
    return new RestInterval(props.duration, new Date(props.startedAt))
  }

  get startedAt(): Date {
    return new Date(this.begunAt)
  }

  get seconds(): number {
    return this.duration.value
  }

  get endsAt(): Date {
    return new Date(this.begunAt.getTime() + this.duration.value * 1000)
  }

  /** Never negative: an interval that is over has nothing left, not a deficit. */
  remainingSecondsAt(instant: Date): number {
    const remaining = Math.ceil((this.endsAt.getTime() - instant.getTime()) / 1000)

    return remaining > 0 ? remaining : 0
  }

  hasElapsedAt(instant: Date): boolean {
    return this.remainingSecondsAt(instant) === 0
  }

  /**
   * Lengthen or shorten the rest, keeping the moment it started.
   *
   * The adjustment lands on the duration rather than on the start, so "three
   * minutes, plus thirty" stays a three-and-a-half minute rest rather than
   * becoming a rest that began at a time the user never rested from.
   * RestDuration refuses anything outside a second and an hour.
   */
  adjustedBy(seconds: number): RestInterval {
    return new RestInterval(RestDuration.create(this.duration.value + seconds), this.begunAt)
  }
}
