import { DomainError, type DomainErrorCode } from '@domain/shared/errors/domain-error.js'

/** Raised when a string cannot be a usable email address. */
export class InvalidEmailError extends DomainError {
  readonly errorCode: DomainErrorCode = 'INVALID_EMAIL'
}

/** Raised when a credential value is structurally unusable. */
export class InvalidCredentialError extends DomainError {
  readonly errorCode: DomainErrorCode = 'INVALID_CREDENTIAL'
}

/**
 * Raised when sign-in fails, whatever the underlying cause.
 *
 * Deliberately one error for both an unknown address and a wrong password: a
 * caller that could tell them apart would let an attacker enumerate which
 * addresses have accounts.
 */
export class AuthenticationFailedError extends DomainError {
  readonly errorCode: DomainErrorCode = 'AUTHENTICATION_FAILED'
}

/** Raised when an expired session is used or renewed. */
export class SessionExpiredError extends DomainError {
  readonly errorCode: DomainErrorCode = 'SESSION_EXPIRED'
}

/** Raised when seeding an account that already exists. */
export class AccountAlreadyExistsError extends DomainError {
  readonly errorCode: DomainErrorCode = 'ACCOUNT_ALREADY_EXISTS'
}
