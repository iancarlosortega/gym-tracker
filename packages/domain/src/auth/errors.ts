/** Raised when a string cannot be a usable email address. */
export class InvalidEmailError extends Error {}

/** Raised when a credential value is structurally unusable. */
export class InvalidCredentialError extends Error {}

/**
 * Raised when sign-in fails, whatever the underlying cause.
 *
 * Deliberately one error for both an unknown address and a wrong password: a
 * caller that could tell them apart would let an attacker enumerate which
 * addresses have accounts.
 */
export class AuthenticationFailedError extends Error {}

/** Raised when an expired session is used or renewed. */
export class SessionExpiredError extends Error {}

/** Raised when seeding an account that already exists. */
export class AccountAlreadyExistsError extends Error {}
