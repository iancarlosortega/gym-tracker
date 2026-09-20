import type { HttpErrorMapping } from '@api/common/http/http-error-mapping.js'
import type { RecomputeErrorCode } from '@gym/domain/shared/errors/domain-error'
import { ConflictException } from '@nestjs/common'

export const recomputeHttpErrors: HttpErrorMapping<RecomputeErrorCode> = {
  // A conflict, not a bad request: the confirmation was fine when it was made.
  STALE_RECOMPUTE_PREVIEW: () =>
    new ConflictException('This history has changed since that preview. Review it again.'),
}
