import type { DisplayUnit } from '@gym/domain/measurement/value-objects/grams.vo'
import { IsIn } from 'class-validator'

export class ChangeDisplayUnitDto {
  @IsIn(['KG', 'LB'])
  displayUnit!: DisplayUnit
}
