/** Too many sign-in or sign-up attempts from this device; waiting is the fix. */
export class RateLimitedError extends Error {
  constructor() {
    super('Too many attempts. Wait a minute and try again.')
    this.name = 'RateLimitedError'
  }
}
