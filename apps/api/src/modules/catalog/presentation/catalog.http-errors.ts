import type { HttpErrorMapping } from '@api/common/http/http-error-mapping.js'
import type { CatalogErrorCode } from '@gym/domain/shared/errors/domain-error'
import { BadRequestException, NotFoundException } from '@nestjs/common'

export const catalogHttpErrors: HttpErrorMapping<CatalogErrorCode> = {
  INVALID_EXERCISE_NAME: () =>
    new BadRequestException('An exercise name must be between 1 and 120 characters.'),
  // The same response whether the record is missing or belongs to someone
  // else: an identifier must not reveal that it exists elsewhere.
  EXERCISE_NOT_FOUND: () => new NotFoundException('That exercise does not exist.'),
  INVALID_EQUIPMENT_NAME: () =>
    new BadRequestException('That equipment is missing something it needs to be usable.'),
  EQUIPMENT_NOT_FOUND: () => new NotFoundException('That equipment does not exist.'),
  EQUIPMENT_CANNOT_MEASURE_THAT_WAY: () =>
    new BadRequestException('That equipment cannot be measured that way.'),
  STACK_POSITION_OUT_OF_RANGE: () =>
    new BadRequestException('That position is beyond the positions this machine has.'),
}
