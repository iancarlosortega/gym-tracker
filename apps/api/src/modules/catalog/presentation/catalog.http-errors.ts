import type { HttpErrorMapping } from '@api/common/http/http-error-mapping.js'
import type { CatalogErrorCode } from '@gym/domain/shared/errors/domain-error'
import { BadRequestException, NotFoundException } from '@nestjs/common'

export const catalogHttpErrors: HttpErrorMapping<CatalogErrorCode> = {
  INVALID_EXERCISE_NAME: () =>
    new BadRequestException('An exercise name must be between 1 and 120 characters.'),
  // The same response whether the exercise is missing or belongs to someone
  // else: an identifier must not reveal that a record exists elsewhere.
  EXERCISE_NOT_FOUND: () => new NotFoundException('That exercise does not exist.'),
}
