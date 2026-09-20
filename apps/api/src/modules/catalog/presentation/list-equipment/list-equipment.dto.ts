import { PaginationDto } from '@api/common/http/dto/pagination.dto.js'
import { EQUIPMENT_KINDS, type EquipmentKind } from '@gym/domain/catalog/entities/equipment.entity'
import { Transform } from 'class-transformer'
import { IsBoolean, IsIn, IsOptional } from 'class-validator'

export class ListEquipmentDto extends PaginationDto {
  @IsOptional()
  @IsIn(EQUIPMENT_KINDS)
  kind?: EquipmentKind

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeArchived?: boolean
}
