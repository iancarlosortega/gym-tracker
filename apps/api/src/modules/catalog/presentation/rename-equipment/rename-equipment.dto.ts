import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class RenameEquipmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string
}
