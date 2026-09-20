import { PaginationDto } from '@api/common/http/dto/pagination.dto.js'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional } from 'class-validator'

export class ListRoutinesDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeArchived?: boolean
}
