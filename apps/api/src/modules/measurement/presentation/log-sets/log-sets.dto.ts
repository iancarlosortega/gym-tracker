import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator'

export class LogSetDto {
  /** Generated on the device, so a retry carries the same id and lands once. */
  @IsUUID()
  id!: string

  @IsUUID()
  exerciseId!: string

  @IsUUID()
  equipmentId!: string

  /** The load in grams; the per-side load for a PER_SIDE exercise. */
  @IsOptional()
  @IsInt()
  @Min(0)
  grams?: number

  /** The pin position, for a stack-measured exercise. */
  @IsOptional()
  @IsInt()
  @Min(1)
  position?: number

  @IsInt()
  @Min(1)
  reps!: number

  @Type(() => Date)
  @IsDate()
  loggedAt!: Date
}

export class LogSetsDto {
  /**
   * Bounded deliberately: a queue that drained for an hour still arrives in
   * readable batches rather than one request nobody can retry.
   */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => LogSetDto)
  sets!: LogSetDto[]
}
