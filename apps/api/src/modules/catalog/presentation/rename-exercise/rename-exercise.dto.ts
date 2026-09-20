import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class RenameExerciseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string
}
