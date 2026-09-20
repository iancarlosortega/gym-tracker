import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { SignInUseCase } from '@api/modules/auth/application/use-cases/sign-in.use-case.js'
import { Public } from '@api/modules/auth/presentation/public.decorator.js'
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from '@api/modules/auth/presentation/session.cookie.js'
import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import { SignInDto } from './sign-in.dto.js'

@Controller('auth')
export class SignInController {
  constructor(
    private readonly signIn: SignInUseCase,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Public()
  @Post('sign-in')
  @HttpCode(204)
  async handle(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const { sessionId } = await this.signIn.execute(body)

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
