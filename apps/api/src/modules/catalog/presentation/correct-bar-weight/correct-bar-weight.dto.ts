import { Type } from 'class-transformer'
import { IsNumber, IsPositive, Max, ValidateIf } from 'class-validator'

export class CorrectBarWeightDto {
  /**
   * Kilograms, as read off the bar, or null to stop counting the bar (a Smith,
   * a sled). Null must be sent on purpose: a missing value is refused.
   */
  @ValidateIf((dto: CorrectBarWeightDto) => dto.barKilograms !== null)
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Max(500)
  barKilograms!: number | null
}
