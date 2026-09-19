import { InvalidDateRangeError } from '@domain/shared/errors.js'

/** A closed interval in time. Both bounds are inclusive. */
export class DateRange {
  private constructor(
    private readonly from: Date,
    private readonly to: Date,
  ) {
    Object.freeze(this)
  }

  static between(start: Date, end: Date): DateRange {
    if (end.getTime() < start.getTime()) {
      throw new InvalidDateRangeError('A date range cannot end before it starts.')
    }
    return new DateRange(new Date(start), new Date(end))
  }

  get start(): Date {
    return new Date(this.from)
  }

  get end(): Date {
    return new Date(this.to)
  }

  contains(instant: Date): boolean {
    const value = instant.getTime()
    return value >= this.from.getTime() && value <= this.to.getTime()
  }
}
