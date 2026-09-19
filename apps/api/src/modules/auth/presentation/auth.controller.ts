import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { SignInUseCase } from '@api/modules/auth/application/use-cases/sign-in.use-case.js'
import { SignOutUseCase } from '@api/modules/auth/application/use-cases/sign-out.use-case.js'
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import type { SignInDto } from './dto/sign-in.dto.js'
import { Public } from './public.decorator.js'
import {
  clearedSessionCookieOptions,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from './session.cookie.js'
import type { RequestWithCaller } from './session.guard.js'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly signIn: SignInUseCase,
    private readonly signOut: SignOutUseCase,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Public()
  @Post('sign-in')
  @HttpCode(204)
  async postSignIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const { sessionId } = await this.signIn.execute(body)

    response.cookie(
      SESSION_COOKIE_NAME,
      sessionId,
      sessionCookieOptions(
        this.secureCookies(),
        this.config.get('SESSION_LIFETIME_DAYS', { infer: true }),
      ),
    )
  }

  @Post('sign-out')
  @HttpCode(204)
  async postSignOut(
    @Req() request: RequestWithCaller,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const sessionId = request.caller?.session.id.value
    if (sessionId !== undefined) {
      await this.signOut.execute({ sessionId })
    }

    response.clearCookie(SESSION_COOKIE_NAME, clearedSessionCookieOptions(this.secureCookies()))
  }

  @Get('me')
  getMe(@Req() request: RequestWithCaller) {
    const user = request.caller?.user
    if (user === undefined) {
      throw new UnauthorizedException()
    }

    return { id: user.id.value, email: user.email.value, displayUnit: user.displayUnit }
  }

  /** Cookies are only marked Secure outside development, where there is no TLS. */
  private secureCookies(): boolean {
    return this.config.get('NODE_ENV', { infer: true }) !== 'development'
  }
}
