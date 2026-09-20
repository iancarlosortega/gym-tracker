import { IsString, IsUrl, MinLength } from 'class-validator'

export class RegisterPushSubscriptionDto {
  /** The push service's URL for this device; opaque to us. */
  @IsUrl({ require_tld: false })
  endpoint!: string

  @IsString()
  @MinLength(1)
  p256dh!: string

  @IsString()
  @MinLength(1)
  auth!: string
}
