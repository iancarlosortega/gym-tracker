import type { HttpErrorMapping } from '@api/common/http/http-error-mapping.js'
import type { AuthErrorCode } from '@gym/domain/shared/errors/domain-error'
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common'

/**
 * Every failed sign-in maps to one status with one message.
 *
 * An unknown address and a wrong password must be indistinguishable from
 * outside, so this mapping must not pass the domain's own message through.
 */
export const authHttpErrors: HttpErrorMapping<AuthErrorCode> = {
  AUTHENTICATION_FAILED: () =>
    new UnauthorizedException('That email and password do not match an account.'),
  SESSION_EXPIRED: () => new UnauthorizedException('Your session has expired; sign in again.'),
  EMAIL_ALREADY_REGISTERED: () =>
    new ConflictException('An account with that email already exists.'),
  WEAK_PASSWORD: () => new BadRequestException('A password needs 8 to 512 characters.'),
  INVALID_EMAIL: () => new BadRequestException('That email address is not usable.'),
  INVALID_CREDENTIAL: () => new BadRequestException('That credential is not usable.'),
}
