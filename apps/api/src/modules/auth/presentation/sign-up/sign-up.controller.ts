import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { SessionIssuer } from '@api/modules/auth/application/services/session-issuer.service.js'
import { RegisterAccountUseCase } from '@api/modules/auth/application/use-cases/register-account.use-case.js'
import { Public } from '@api/modules/auth/presentation/public.decorator.js'
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '@api/modules/auth/presentation/session.cookie.js'
import { Body, Controller, HttpCode, Post, Res, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ThrottlerGuard } from '@nestjs/throttler'
import type { Response } from 'express'
import { SignUpDto } from './sign-up.dto.js'

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class SignUpController {
  constructor(
    private readonly register: RegisterAccountUseCase,
    private readonly issuer: SessionIssuer,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  /** Creates the account and signs it in, so registering lands on Home. */
  @Public()
  @Post('sign-up')
  @HttpCode(201)
  async handle(
    @Body() body: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const user = await this.register.execute(body)
    const { sessionId } = await this.issuer.issue(user.id)

    response.cookie(
      SESSION_COOKIE_NAME,
      sessionId,
      sessionCookieOptions(
        this.config.get('NODE_ENV', { infer: true }) !== 'development',
        this.config.get('SESSION_LIFETIME_DAYS', { infer: true }),
      ),
    )
  }
}
