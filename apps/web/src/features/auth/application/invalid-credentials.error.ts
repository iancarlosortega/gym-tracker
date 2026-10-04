/**
 * The server did not accept that email and password.
 *
 * One error for every refusal, on purpose: the API answers an unknown address
 * and a wrong password identically, and the client must not invent a
 * difference between them.
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('That email and password do not match.')
    this.name = 'InvalidCredentialsError'
  }
}
