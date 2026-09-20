import type { HttpErrorMapping } from '@api/common/http/http-error-mapping.js'
import type { WorkoutErrorCode } from '@gym/domain/shared/errors/domain-error'
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'

export const workoutsHttpErrors: HttpErrorMapping<WorkoutErrorCode> = {
  WORKOUT_SESSION_NOT_FOUND: () => new NotFoundException('That workout does not exist.'),
  WORKOUT_ALREADY_FINISHED: () => new ConflictException('That workout has already been finished.'),
  // A conflict rather than a bad request: the request is fine, the state is not.
  WORKOUT_ALREADY_OPEN: () => new ConflictException('You already have a workout in progress.'),
  INVALID_WORKOUT_TIMES: () =>
    new BadRequestException('A workout cannot finish before it started.'),
}
