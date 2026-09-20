import type { HttpErrorMapping } from '@api/common/http/http-error-mapping.js'
import type { PushErrorCode } from '@gym/domain/shared/errors/domain-error'
import { BadRequestException } from '@nestjs/common'

export const pushHttpErrors: HttpErrorMapping<PushErrorCode> = {
  // The rest already ended; there is nothing left to be alerted about.
  PUSH_SCHEDULED_IN_THE_PAST: () =>
    new BadRequestException('That rest has already finished, so no alert was scheduled.'),
  INVALID_PUSH_SUBSCRIPTION: () =>
    new BadRequestException('That push subscription is missing its endpoint or keys.'),
}
