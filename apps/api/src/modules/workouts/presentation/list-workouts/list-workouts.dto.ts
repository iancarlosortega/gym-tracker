import { Type } from 'class-transformer'
import { IsInt, IsOptional, Min } from 'class-validator'

/** Query strings arrive as text, so both are converted before they are checked. */
export class ListWorkoutsDto {
  /** Clamped to the page maximum rather than refused. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number
}
