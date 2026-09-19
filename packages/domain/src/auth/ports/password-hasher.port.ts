import type { PasswordHash } from '@domain/auth/value-objects/password-hash.vo.js'

/**
 * Hashing lives behind a port so the domain never handles a plaintext password
 * and never learns which algorithm is in use.
 */
export interface PasswordHasher {
  hash(plaintext: string): Promise<PasswordHash>
  verify(plaintext: string, hash: PasswordHash): Promise<boolean>
}
