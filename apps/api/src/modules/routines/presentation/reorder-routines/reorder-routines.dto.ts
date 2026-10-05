import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator'

export class ReorderRoutinesDto {
  /** Every active routine, exactly once, in the order they should appear. */
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  routineIds!: string[]
}
