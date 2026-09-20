import { Type } from 'class-transformer'
import { IsNumber, IsPositive, Max } from 'class-validator'

export class CorrectBarWeightDto {
  /** Kilograms, as read off the bar. */
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Max(500)
  barKilograms!: number
}
