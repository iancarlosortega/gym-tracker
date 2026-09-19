import { InvalidEmailError } from '@domain/auth/errors.js'

const SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/** An email address, normalised so one person cannot become two accounts. */
export class Email {
  private constructor(private readonly address: string) {
    Object.freeze(this)
  }

  static create(input: string): Email {
    const normalised = input.trim().toLowerCase()

    if (!SHAPE.test(normalised)) {
      throw new InvalidEmailError(`Not a usable email address: ${JSON.stringify(input)}.`)
    }
    return new Email(normalised)
  }

  get value(): string {
    return this.address
  }

  equals(other: Email): boolean {
    return this.address === other.address
  }

  toString(): string {
    return this.address
  }
}
