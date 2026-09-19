import type { SharedErrorCode } from '@gym/domain/shared/errors/domain-error'
import { BadRequestException } from '@nestjs/common'
import type { HttpErrorMapping } from './http-error-mapping.js'

export const sharedHttpErrors: HttpErrorMapping<SharedErrorCode> = {
  INVALID_ID: () => new BadRequestException('That identifier is not a valid UUID.'),
  INVALID_DATE_RANGE: () => new BadRequestException('That date range ends before it starts.'),
  INVALID_QUERY_OPTION: () => new BadRequestException('That query limit or offset is not usable.'),
}
