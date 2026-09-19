import { InvalidCredentialError } from '@domain/auth/errors.js'

/**
 * A stored password hash.
 *
 * The domain never sees a plaintext password: hashing happens behind the
 * PasswordHasher port, and only the result is modelled here.
 */
export class PasswordHash {
  private constructor(private readonly digest: string) {
    Object.freeze(this)
  }

  static create(digest: string): PasswordHash {
    if (digest.trim().length === 0) {
      throw new InvalidCredentialError('A password hash cannot be empty.')
    }
    return new PasswordHash(digest)
  }

  get value(): string {
    return this.digest
  }
}
