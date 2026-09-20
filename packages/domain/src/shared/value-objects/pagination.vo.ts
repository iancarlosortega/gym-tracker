import { InvalidQueryOptionError } from '@domain/shared/errors.js'

const DEFAULT_LIMIT = 50
const MAXIMUM_LIMIT = 200

export interface PaginationInput {
  readonly limit?: number | undefined
  readonly offset?: number | undefined
}

/**
 * A bounded window over a result set.
 *
 * Every repository read takes one, so an unbounded query cannot be expressed
 * through the port at all. The limit is clamped rather than rejected: a client
 * asking for ten thousand rows gets the maximum page instead of an error, and
 * the database is never asked for the ten thousand.
 */
export class Pagination {
  private constructor(
    private readonly size: number,
    private readonly skipped: number,
  ) {
    Object.freeze(this)
  }

  static create(input: PaginationInput = {}): Pagination {
    const requested = input.limit ?? DEFAULT_LIMIT
    const offset = input.offset ?? 0

    if (!Number.isInteger(requested) || requested < 1) {
      throw new InvalidQueryOptionError(
        `A page limit must be a whole number of 1 or more, received ${requested}.`,
      )
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw new InvalidQueryOptionError(
        `A page offset must be a whole number of 0 or more, received ${offset}.`,
      )
    }

    return new Pagination(Math.min(requested, MAXIMUM_LIMIT), offset)
  }

  get limit(): number {
    return this.size
  }

  get offset(): number {
    return this.skipped
  }

  next(): Pagination {
    return new Pagination(this.size, this.skipped + this.size)
  }
}
