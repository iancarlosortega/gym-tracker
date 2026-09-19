/** Time as a dependency, so expiry behaviour is testable without waiting. */
export interface Clock {
  now(): Date
}
