import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { DATABASE } from '@api/database/database.module.js'
import { SeedAccountUseCase } from '@api/modules/auth/application/use-cases/seed-account.use-case.js'
import { SignInUseCase } from '@api/modules/auth/application/use-cases/sign-in.use-case.js'
import { SignOutUseCase } from '@api/modules/auth/application/use-cases/sign-out.use-case.js'
import { ValidateSessionUseCase } from '@api/modules/auth/application/use-cases/validate-session.use-case.js'
import { Argon2Hasher } from '@api/modules/auth/infrastructure/adapters/argon2-hasher.adapter.js'
import { SystemClock } from '@api/modules/auth/infrastructure/adapters/system-clock.adapter.js'
import { DrizzleAuthSessionRepository } from '@api/modules/auth/infrastructure/persistence/drizzle-auth-session.repository.js'
import {
  type AuthDatabase,
  DrizzleUserRepository,
} from '@api/modules/auth/infrastructure/persistence/drizzle-user.repository.js'
import { AuthController } from '@api/modules/auth/presentation/auth.controller.js'
import { SessionGuard } from '@api/modules/auth/presentation/session.guard.js'
import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'

const USER_REPOSITORY = Symbol('USER_REPOSITORY')
const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY')
const PASSWORD_HASHER = Symbol('PASSWORD_HASHER')
const CLOCK = Symbol('CLOCK')

/**
 * Composition root for authentication.
 *
 * Every port is bound to its adapter here and nowhere else, so the application
 * layer stays unaware of argon2, Drizzle and the system clock.
 */
@Module({
  controllers: [AuthController],
  providers: [
    { provide: PASSWORD_HASHER, useClass: Argon2Hasher },
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: USER_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: AuthDatabase) => new DrizzleUserRepository(database),
    },
    {
      provide: SESSION_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: AuthDatabase) => new DrizzleAuthSessionRepository(database),
    },
    {
      provide: SignInUseCase,
      inject: [USER_REPOSITORY, SESSION_REPOSITORY, PASSWORD_HASHER, CLOCK, ConfigService],
      useFactory: (
        users: ConstructorParameters<typeof SignInUseCase>[0],
        sessions: ConstructorParameters<typeof SignInUseCase>[1],
        hasher: ConstructorParameters<typeof SignInUseCase>[2],
        clock: ConstructorParameters<typeof SignInUseCase>[3],
        config: ConfigService<EnvironmentVariables, true>,
      ) =>
        new SignInUseCase(users, sessions, hasher, clock, {
          sessionLifetimeDays: config.get('SESSION_LIFETIME_DAYS', { infer: true }),
        }),
    },
    {
      provide: SignOutUseCase,
      inject: [SESSION_REPOSITORY],
      useFactory: (sessions: ConstructorParameters<typeof SignOutUseCase>[0]) =>
        new SignOutUseCase(sessions),
    },
    {
      provide: SeedAccountUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
      useFactory: (
        users: ConstructorParameters<typeof SeedAccountUseCase>[0],
        hasher: ConstructorParameters<typeof SeedAccountUseCase>[1],
      ) => new SeedAccountUseCase(users, hasher),
    },
    {
      provide: ValidateSessionUseCase,
      inject: [USER_REPOSITORY, SESSION_REPOSITORY, CLOCK, ConfigService],
      useFactory: (
        users: ConstructorParameters<typeof ValidateSessionUseCase>[0],
        sessions: ConstructorParameters<typeof ValidateSessionUseCase>[1],
        clock: ConstructorParameters<typeof ValidateSessionUseCase>[2],
        config: ConfigService<EnvironmentVariables, true>,
      ) =>
        new ValidateSessionUseCase(users, sessions, clock, {
          sessionLifetimeDays: config.get('SESSION_LIFETIME_DAYS', { infer: true }),
        }),
    },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
  exports: [SeedAccountUseCase],
})
export class AuthModule {}
