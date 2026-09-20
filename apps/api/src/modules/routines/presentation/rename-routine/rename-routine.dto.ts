import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class RenameRoutineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string
}
