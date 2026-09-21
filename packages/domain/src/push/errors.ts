import { DomainError, type PushErrorCode } from '@domain/shared/errors/domain-error.js'

/** Raised when a push is scheduled for a moment that has already passed. */
export class PushScheduledInThePastError extends DomainError {
  readonly errorCode: PushErrorCode = 'PUSH_SCHEDULED_IN_THE_PAST'
}

/** Raised when a subscription is missing the keys a push service needs. */
export class InvalidPushSubscriptionError extends DomainError {
  readonly errorCode: PushErrorCode = 'INVALID_PUSH_SUBSCRIPTION'
}
