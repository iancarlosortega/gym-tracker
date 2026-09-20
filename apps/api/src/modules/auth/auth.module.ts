import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { SeedAccountUseCase } from '@api/modules/auth/application/use-cases/seed-account.use-case.js'
import type { SessionPolicy } from '@api/modules/auth/application/use-cases/sign-in.use-case.js'
import { SignInUseCase } from '@api/modules/auth/application/use-cases/sign-in.use-case.js'
import { SignOutUseCase } from '@api/modules/auth/application/use-cases/sign-out.use-case.js'
import { ValidateSessionUseCase } from '@api/modules/auth/application/use-cases/validate-session.use-case.js'
import {
  CLOCK,
  PASSWORD_HASHER,
  SESSION_POLICY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
} from '@api/modules/auth/auth.tokens.js'
import { Argon2Hasher } from '@api/modules/auth/infrastructure/adapters/argon2-hasher.adapter.js'
import { SystemClock } from '@api/modules/auth/infrastructure/adapters/system-clock.adapter.js'
import { DrizzleAuthSessionRepository } from '@api/modules/auth/infrastructure/persistence/drizzle-auth-session.repository.js'
import { DrizzleUserRepository } from '@api/modules/auth/infrastructure/persistence/drizzle-user.repository.js'
import { MeController } from '@api/modules/auth/presentation/me/me.controller.js'
import { SessionGuard } from '@api/modules/auth/presentation/session.guard.js'
import { SignInController } from '@api/modules/auth/presentation/sign-in/sign-in.controller.js'
import { SignOutController } from '@api/modules/auth/presentation/sign-out/sign-out.controller.js'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'

/**
 * Composition root for authentication.
 *
 * Every port is bound to its adapter here and nowhere else, so the application
 * layer stays unaware of argon2, Drizzle and the system clock.
 */
@Module({
  controllers: [SignInController, SignOutController, MeController],
  providers: [
    { provide: PASSWORD_HASHER, useClass: Argon2Hasher },
    { provide: CLOCK, useClass: SystemClock },
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: SESSION_REPOSITORY, useClass: DrizzleAuthSessionRepository },
    {
      provide: SESSION_POLICY,
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>): SessionPolicy => ({
        sessionLifetimeDays: config.get('SESSION_LIFETIME_DAYS', { infer: true }),
      }),
    },
    SignInUseCase,
    SignOutUseCase,
    SeedAccountUseCase,
    ValidateSessionUseCase,
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
  exports: [SeedAccountUseCase],
})
export class AuthModule {}
