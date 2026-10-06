import { WeakPasswordError } from '@domain/auth/errors.js'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 512

/**
 * Refuse a password a new account cannot have.
 *
 * Length is the only rule, following NIST 800-63B: composition rules push
 * people towards `Password1!` and away from long passphrases, which are the
 * stronger choice. The ceiling bounds the work the hasher is asked to do.
 *
 * Length is counted in code points, so a password of emoji is measured the
 * way the person typing it would count it.
 */
export const checkPasswordPolicy = (password: string): void => {
  const length = [...password].length

  if (length < PASSWORD_MIN_LENGTH) {
    throw new WeakPasswordError(`A password needs at least ${PASSWORD_MIN_LENGTH} characters.`)
  }
  if (length > PASSWORD_MAX_LENGTH) {
    throw new WeakPasswordError(`A password can have at most ${PASSWORD_MAX_LENGTH} characters.`)
  }
}
