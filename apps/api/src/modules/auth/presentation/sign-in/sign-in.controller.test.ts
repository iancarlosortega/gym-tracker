import { DomainExceptionFilter } from '@api/common/filters/domain-exception.filter.js'
import { SignInUseCase } from '@api/modules/auth/application/use-cases/sign-in.use-case.js'
import { authThrottlerForTests } from '@api/modules/auth/testing/auth-throttler.testing.js'
import { AuthenticationFailedError } from '@gym/domain/auth/errors'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SignInController } from './sign-in.controller.ts'

let app: NestExpressApplication
let signInBehaviour: () => Promise<{ sessionId: string; expiresAt: Date }>

const settings: Record<string, unknown> = {
  SESSION_LIFETIME_DAYS: 90,
  NODE_ENV: 'test',
  AUTH_RATE_LIMIT: 5,
  AUTH_RATE_WINDOW_SECONDS: 60,
}
const config = { get: (key: string) => settings[key] }

beforeEach(async () => {
  signInBehaviour = async () => ({
    sessionId: '0199a1f0-0000-7000-8000-00000000d001',
    expiresAt: new Date('2026-12-18T12:00:00.000Z'),
  })

  const moduleRef = await Test.createTestingModule({
    imports: [authThrottlerForTests(settings)],
    controllers: [SignInController],
    providers: [
      { provide: SignInUseCase, useValue: { execute: () => signInBehaviour() } },
      { provide: ConfigService, useValue: config },
      { provide: APP_GUARD, useValue: { canActivate: () => true } },
    ],
  }).compile()

  app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false })
  // No ValidationPipe here: Vitest's transform does not emit the decorator
  // metadata Nest needs to associate @Body() with its DTO class, so the pipe
  // would silently do nothing. The request contract is covered directly in
  // sign-in.dto.test.ts instead.
  app.useGlobalFilters(new DomainExceptionFilter())

  await app.init()
})

afterEach(async () => {
  await app.close()
})

describe('signing in over http', () => {
  it('sets an HttpOnly, SameSite=Lax session cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email: 'ian@example.test', password: 'correct horse battery' })
      .expect(204)

    const cookie = response.headers['set-cookie']?.[0] ?? ''

    expect(cookie).toContain('gym_session=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toMatch(/SameSite=Lax/i)
  })

  it('maps a domain authentication failure to 401 without the controller catching it', async () => {
    signInBehaviour = async () => {
      throw new AuthenticationFailedError('That email and password do not match an account.')
    }

    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email: 'ian@example.test', password: 'wrong' })
      .expect(401)

    expect(response.body.message).toBe('That email and password do not match an account.')
  })

  it('sets no cookie when authentication fails', async () => {
    signInBehaviour = async () => {
      throw new AuthenticationFailedError('nope')
    }

    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email: 'ian@example.test', password: 'wrong' })
      .expect(401)

    expect(response.headers['set-cookie']).toBeUndefined()
  })

  it('refuses the sixth attempt in a minute, so passwords cannot be guessed at speed', async () => {
    signInBehaviour = async () => {
      throw new AuthenticationFailedError('nope')
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({ email: 'ian@example.test', password: 'wrong' })
        .expect(401)
    }

    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email: 'ian@example.test', password: 'wrong' })
      .expect(429)

    expect(response.headers['retry-after']).toBeDefined()
  })
})
