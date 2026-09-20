import { IsString, IsUrl, MinLength } from 'class-validator'

export class RegisterPushSubscriptionDto {
  /**
   * The push service's URL for this device; opaque to us.
   *
   * No top-level domain is required: a push endpoint may be any host the
   * browser's push service hands back, including one without a public TLD.
   */
  // biome-ignore lint/style/useNamingConvention: class-validator names this option.
  @IsUrl({ require_tld: false })
  endpoint!: string

  @IsString()
  @MinLength(1)
  p256dh!: string

  @IsString()
  @MinLength(1)
  auth!: string
}
