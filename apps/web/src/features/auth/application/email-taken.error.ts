/** An account already exists for that address; signing in is the way forward. */
export class EmailTakenError extends Error {
  constructor() {
    super('An account with that email already exists.')
    this.name = 'EmailTakenError'
  }
}
