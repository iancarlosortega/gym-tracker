import { DomainExceptionFilter } from '@api/common/filters/domain-exception.filter.js'
import { SessionIssuer } from '@api/modules/auth/application/services/session-issuer.service.js'
import { RegisterAccountUseCase } from '@api/modules/auth/application/use-cases/register-account.use-case.js'
import { authThrottlerForTests } from '@api/modules/auth/testing/auth-throttler.testing.js'
import { User } from '@gym/domain/auth/entities/user.entity'
import { EmailAlreadyRegisteredError, WeakPasswordError } from '@gym/domain/auth/errors'
import { PasswordHash } from '@gym/domain/auth/value-objects/password-hash.vo'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SignUpController } from './sign-up.controller.ts'

let app: NestExpressApplication
let registerBehaviour: () => Promise<User>
let issued: string[]

const settings: Record<string, unknown> = {
  SESSION_LIFETIME_DAYS: 90,
  NODE_ENV: 'test',
  AUTH_RATE_LIMIT: 5,
  AUTH_RATE_WINDOW_SECONDS: 60,
}
const config = { get: (key: string) => settings[key] }

const newUser = () =>
  User.create({ email: 'new@example.test', passwordHash: PasswordHash.create('fake$1') })

beforeEach(async () => {
  issued = []
  registerBehaviour = async () => newUser()

  const moduleRef = await Test.createTestingModule({
    imports: [authThrottlerForTests(settings)],
    controllers: [SignUpController],
    providers: [
      { provide: RegisterAccountUseCase, useValue: { execute: () => registerBehaviour() } },
      {
        provide: SessionIssuer,
        useValue: {
          issue: async (userId: { value: string }) => {
            issued.push(userId.value)
            return {
              sessionId: '0199a1f0-0000-7000-8000-00000000d001',
              expiresAt: new Date('2026-12-18T12:00:00.000Z'),
            }
          },
        },
      },
      { provide: ConfigService, useValue: config },
      { provide: APP_GUARD, useValue: { canActivate: () => true } },
    ],
  }).compile()

  app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false })
  // One proxy hop in front, as in the deploy: the client is the forwarded address.
  app.set('trust proxy', 1)
  app.useGlobalFilters(new DomainExceptionFilter())

  await app.init()
})

afterEach(async () => {
  await app.close()
})

const signUp = (from = '203.0.113.1') =>
  request(app.getHttpServer())
    .post('/auth/sign-up')
    .set('X-Forwarded-For', from)
    .send({ email: 'new@example.test', password: 'correct horse battery' })

describe('signing up over http', () => {
  it('creates the account and signs it in with an HttpOnly session cookie', async () => {
    const response = await signUp().expect(201)

    const cookie = response.headers['set-cookie']?.[0] ?? ''
    expect(cookie).toContain('gym_session=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toMatch(/SameSite=Lax/i)
    expect(issued).toHaveLength(1)
  })

  it('answers 409 for a taken address and issues no session', async () => {
    registerBehaviour = async () => {
      throw new EmailAlreadyRegisteredError('taken')
    }

    const response = await signUp().expect(409)

    expect(response.body.message).toBe('An account with that email already exists.')
    expect(response.headers['set-cookie']).toBeUndefined()
    expect(issued).toHaveLength(0)
  })

  it('answers 400 for a password the policy refuses', async () => {
    registerBehaviour = async () => {
      throw new WeakPasswordError('short')
    }

    const response = await signUp().expect(400)

    expect(response.body.message).toBe('A password needs 8 to 512 characters.')
  })
})

describe('rate limiting sign-up', () => {
  it('refuses the sixth attempt in a minute from one client, and says when to retry', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await signUp().expect(201)
    }

    const response = await signUp().expect(429)

    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0)
    expect(response.body.message).toBe('Too many attempts. Wait a minute and try again.')
  })

  it('keys the limit on the forwarded client, so one client over the limit does not block another', async () => {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await signUp('203.0.113.1')
    }

    await signUp('198.51.100.7').expect(201)
  })
})
