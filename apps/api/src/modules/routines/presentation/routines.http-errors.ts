import type { HttpErrorMapping } from '@api/common/http/http-error-mapping.js'
import type { RoutineErrorCode } from '@gym/domain/shared/errors/domain-error'
import { BadRequestException, NotFoundException } from '@nestjs/common'

export const routinesHttpErrors: HttpErrorMapping<RoutineErrorCode> = {
  INVALID_ROUTINE_NAME: () =>
    new BadRequestException('A routine name must be between 1 and 120 characters.'),
  ROUTINE_NOT_FOUND: () => new NotFoundException('That routine does not exist.'),
  ROUTINE_ENTRY_NOT_FOUND: () => new NotFoundException('That exercise is not in this routine.'),
  INVALID_REST_DURATION: () =>
    new BadRequestException('A rest duration must be between 1 second and an hour.'),
  INVALID_TARGET_REPS: () =>
    new BadRequestException('A repetition target must be a whole number between 1 and 100.'),
  INVALID_ROUTINE_ORDER: () =>
    new BadRequestException('A reorder must name every exercise in the routine exactly once.'),
}
