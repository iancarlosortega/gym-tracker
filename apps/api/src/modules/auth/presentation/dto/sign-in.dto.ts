import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class SignInDto {
  /**
   * Validated for shape only, not for being a well-formed address.
   *
   * Rejecting a malformed address here with a 400 would tell an attacker that
   * the value never reached the account lookup, which is a difference they can
   * measure. The use case treats malformed, unknown and wrong alike.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  email!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  password!: string
}
