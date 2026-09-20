import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsPositive, IsUUID, Max, Min } from 'class-validator'

export class AddRoutineExerciseDto {
  @IsUUID()
  exerciseId!: string

  /** Optional: only some exercises care which bar or machine they use. */
  @IsOptional()
  @IsUUID()
  equipmentId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(50)
  targetSets?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  targetRepsMin?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  targetRepsMax?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3600)
  restSeconds?: number
}
