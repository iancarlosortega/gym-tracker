import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator'

export class ReorderRoutineDto {
  /**
   * Every entry in the routine, exactly once, in the order they should appear.
   *
   * A partial order is refused by the domain rather than interpreted: filling
   * in the gaps would mean guessing, and guessing drops an exercise.
   */
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  entryIds!: string[]
}
