import { InvalidIdError } from '@domain/shared/errors.js'

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

/**
 * A UUIDv7 identity.
 *
 * Generation lives inside the value object rather than behind an injected
 * generator port: an id is a property of the thing being created, not a
 * collaborator a use case should have to be handed. Version 7 is used because
 * it is time-ordered, so freshly created rows land next to each other in an
 * index instead of scattering across it the way v4 does.
 */
export class Id {
  private constructor(private readonly id: string) {
    Object.freeze(this)
  }

  static create(): Id {
    return new Id(uuidV7(Date.now()))
  }

  /** Generation at a chosen instant. Keeps ordering assertions testable. */
  static createAt(instant: Date): Id {
    return new Id(uuidV7(instant.getTime()))
  }

  static restore(value: string): Id {
    const normalised = value.trim().toLowerCase()
    if (!UUID_SHAPE.test(normalised)) {
      throw new InvalidIdError(`Not a usable UUID: ${JSON.stringify(value)}.`)
    }
    return new Id(normalised)
  }

  get value(): string {
    return this.id
  }

  equals(other: Id): boolean {
    return this.id === other.id
  }

  toString(): string {
    return this.id
  }
}

/**
 * The only platform capability the domain depends on, declared as the narrow
 * shape it needs rather than by pulling in a DOM or Node library. Both
 * browsers and Node 18+ provide it.
 */
declare const crypto: { getRandomValues(array: Uint8Array): Uint8Array }

function uuidV7(milliseconds: number): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  const timestamp = BigInt(milliseconds)
  for (let index = 0; index < 6; index += 1) {
    bytes[index] = Number((timestamp >> BigInt(8 * (5 - index))) & 0xffn)
  }

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}
