import type { HttpErrorMapping } from '@api/common/http/http-error-mapping.js'
import type { MeasurementErrorCode } from '@gym/domain/shared/errors/domain-error'
import { BadRequestException, NotFoundException } from '@nestjs/common'

export const measurementHttpErrors: HttpErrorMapping<MeasurementErrorCode> = {
  INVALID_GRAMS: () => new BadRequestException('That weight is not a usable value.'),
  INVALID_COUNT: () => new BadRequestException('That count must be a whole number of 1 or more.'),
  MISSING_MEASUREMENT_MODE: () =>
    new BadRequestException('A load entry must declare a measurement mode.'),
  UNKNOWN_MEASUREMENT_MODE: () =>
    new BadRequestException('That measurement mode is not supported.'),
  MISSING_BAR_WEIGHT: () =>
    new BadRequestException('A bar weight is required to resolve a per-side entry.'),
  CROSS_EXERCISE_COMPARISON: () =>
    new BadRequestException('Stack positions from different exercises are not comparable.'),
  SNAPSHOT_MISMATCH: () =>
    new BadRequestException("A set's recorded equipment contradicts the entry it describes."),
  LOAD_CORRECTION_MISMATCH: () =>
    new BadRequestException('A set is corrected in the same kind of load it was logged in.'),
  SET_NOT_FOUND: () => new NotFoundException('That set does not exist.'),
}
