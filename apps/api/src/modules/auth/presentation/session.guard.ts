import type { RequestWithCaller } from '@api/common/http/decorators/caller.decorator.js'
import { ValidateSessionUseCase } from '@api/modules/auth/application/use-cases/validate-session.use-case.js'
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC } from './public.decorator.js'
import { SESSION_COOKIE_NAME } from './session.cookie.js'

/**
 * Refuses every request that does not carry a live session.
 *
 * Applied to the whole application rather than opted into per controller: a
 * guard you have to remember to add is a guard that will eventually be
 * forgotten on the one route that mattered.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly validateSession: ValidateSessionUseCase,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic === true) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithCaller>()
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME]

    if (typeof sessionId !== 'string' || sessionId.length === 0) {
      throw new UnauthorizedException()
    }

    const caller = await this.validateSession.execute(sessionId)
    if (caller === null) {
      throw new UnauthorizedException()
    }

    request.caller = caller
    return true
  }
}
