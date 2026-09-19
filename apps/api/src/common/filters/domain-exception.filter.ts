import type { HttpErrorMapping } from '@api/common/http/http-error-mapping.js'
import { sharedHttpErrors } from '@api/common/http/shared.http-errors.js'
import { authHttpErrors } from '@api/modules/auth/presentation/auth.http-errors.js'
import { measurementHttpErrors } from '@api/modules/measurement/presentation/measurement.http-errors.js'
import { DomainError, type DomainErrorCode } from '@gym/domain/shared/errors/domain-error'
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common'
import type { Response } from 'express'

/**
 * The composed mapping.
 *
 * Each feature owns its own table beside its module; this joins them. The
 * annotation is what makes the split safe: because the result must satisfy
 * `HttpErrorMapping<DomainErrorCode>`, adding a code to the domain without
 * mapping it anywhere is a compile error rather than a 500 discovered in
 * production.
 *
 * One filter rather than one per module is deliberate. Nest dispatches filters
 * by exception type, not by module, so several filters catching DomainError
 * would not compose — the last registration would win and the rest would be
 * dead code.
 */
const httpErrors: HttpErrorMapping<DomainErrorCode> = {
  ...sharedHttpErrors,
  ...authHttpErrors,
  ...measurementHttpErrors,
}

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  private readonly logger = new Logger(DomainExceptionFilter.name)

  catch(error: DomainError, host: ArgumentsHost): void {
    const build = httpErrors[error.code]

    if (build === undefined) {
      // Only reachable if a code arrives that the type system did not know
      // about. That is a gap in ours, not a mistake by the caller, so it is a
      // server fault rather than a 400 that blames them.
      this.logger.error(`No HTTP mapping for domain error code ${error.code}: ${error.message}`)
      this.respond(host, new InternalServerErrorException())
      return
    }

    this.respond(host, build())
  }

  private respond(host: ArgumentsHost, exception: HttpException): void {
    const response = host.switchToHttp().getResponse<Response>()
    response.status(exception.getStatus()).json(exception.getResponse())
  }
}
