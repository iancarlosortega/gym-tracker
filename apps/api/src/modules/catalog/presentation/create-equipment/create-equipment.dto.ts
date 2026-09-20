import { EQUIPMENT_KINDS, type EquipmentKind } from '@gym/domain/catalog/entities/equipment.entity'
import { Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  MaxLength,
} from 'class-validator'

export class CreateEquipmentDto {
  @IsNotEmpty()
  @MaxLength(120)
  name!: string

  @IsIn(EQUIPMENT_KINDS)
  kind!: EquipmentKind

  /**
   * Kilograms, not grams: this is what a person reads off the bar. Required
   * for a barbell, and the domain refuses one without it.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Max(500)
  barKilograms?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  stackPositions?: number
}
