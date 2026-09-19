import type { PasswordHasher } from '@gym/domain/auth/ports/password-hasher.port'
import { PasswordHash } from '@gym/domain/auth/value-objects/password-hash.vo'
import { hash, verify } from '@node-rs/argon2'

/**
 * Argon2id, the memory-hard default.
 *
 * Sign-in happens rarely on a single-user system, so the cost parameters are
 * chosen for resistance rather than throughput; the box can afford it.
 */
export class Argon2Hasher implements PasswordHasher {
  async hash(plaintext: string): Promise<PasswordHash> {
    return PasswordHash.create(await hash(plaintext))
  }

  async verify(plaintext: string, stored: PasswordHash): Promise<boolean> {
    try {
      return await verify(stored.value, plaintext)
    } catch {
      // A malformed or truncated stored hash is a failed verification, not a
      // crash that would leak the difference to the caller.
      return false
    }
  }
}
