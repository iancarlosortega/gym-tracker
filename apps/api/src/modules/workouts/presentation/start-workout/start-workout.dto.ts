import { IsOptional, IsUUID } from 'class-validator'

export class StartWorkoutDto {
  /** Omitted for an ad hoc workout. */
  @IsOptional()
  @IsUUID()
  routineId?: string
}
