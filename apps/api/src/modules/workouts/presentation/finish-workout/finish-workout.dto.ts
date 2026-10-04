import { IsISO8601, IsOptional } from 'class-validator'

export class FinishWorkoutDto {
  /** When the user pressed finish; omitted, the server's clock is used. */
  @IsOptional()
  @IsISO8601({ strict: true })
  finishedAt?: string
}
