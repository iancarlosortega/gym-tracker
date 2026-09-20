import { PaginationDto } from '@api/common/http/dto/pagination.dto.js'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'

export class ListExercisesDto extends PaginationDto {
  /** Archived exercises are hidden by default, which is what routine building needs. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeArchived?: boolean
}
