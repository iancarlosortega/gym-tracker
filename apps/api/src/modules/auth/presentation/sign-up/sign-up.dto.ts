import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

/**
 * Validated for shape only. Whether the address is usable and the password
 * long enough are domain rules, answered by the use case with the same
 * messages the seed command gets.
 */
export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  email!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  password!: string
}
