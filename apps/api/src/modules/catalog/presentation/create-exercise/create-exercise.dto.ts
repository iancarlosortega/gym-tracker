import {
  MEASUREMENT_MODES,
  type MeasurementMode,
} from '@gym/domain/measurement/value-objects/load-entry.vo'
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string

  /**
   * The mode is fixed for the life of the exercise, so it is required here and
   * has no counterpart on the rename DTO: changing it would reinterpret every
   * set already logged.
   */
  @IsIn(MEASUREMENT_MODES)
  defaultMode!: MeasurementMode
}
