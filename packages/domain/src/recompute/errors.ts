import { DomainError, type RecomputeErrorCode } from '@domain/shared/errors/domain-error.js'

/**
 * Raised when a confirmation does not describe the history as it stands.
 *
 * Something changed between the preview and the confirmation, so applying
 * would change sets the user never reviewed.
 */
export class StaleRecomputePreviewError extends DomainError {
  readonly code: RecomputeErrorCode = 'STALE_RECOMPUTE_PREVIEW'
}
