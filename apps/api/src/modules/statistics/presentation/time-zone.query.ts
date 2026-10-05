import { IsOptional, IsTimeZone } from 'class-validator'

/**
 * The phone's IANA zone, for any read that cuts days or weeks.
 *
 * Optional: without it the server keeps UTC, which is what clients sent
 * before they knew to say where they are.
 */
export class TimeZoneQuery {
  @IsOptional()
  @IsTimeZone()
  timeZone?: string
}
