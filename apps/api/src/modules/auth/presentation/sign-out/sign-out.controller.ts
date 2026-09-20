import { GetSessionId } from '@api/common/http/decorators/caller.decorator.js'
import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { SignOutUseCase } from '@api/modules/auth/application/use-cases/sign-out.use-case.js'
import {
  clearedSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from '@api/modules/auth/presentation/session.cookie.js'
import { Controller, HttpCode, Post, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'

/** No DTO: the session being ended is the one the request already carries. */
@Controller('auth')
export class SignOutController {
  constructor(
    private readonly signOut: SignOutUseCase,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Post('sign-out')
  @HttpCode(204)
  async handle(
    @GetSessionId() sessionId: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (sessionId !== undefined) {
      await this.signOut.execute({ sessionId })
    }

    response.clearCookie(
      SESSION_COOKIE_NAME,
      clearedSessionCookieOptions(this.config.get('NODE_ENV', { infer: true }) !== 'development'),
    )
  }
}
