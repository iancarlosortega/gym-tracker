import { describe, expect, it } from 'vitest'
import { environmentSchema } from './environment.schema.ts'

const valid = {
  DATABASE_URL: 'postgres://localhost:5432/gymtracker',
  FRONTEND_ORIGIN: 'https://gym.example.com',
  API_ORIGIN: 'https://api.gym.example.com',
}

describe('the environment schema', () => {
  it('accepts a valid environment and applies defaults', () => {
    const parsed = environmentSchema.parse(valid)

    expect(parsed.PORT).toBe(3001)
    expect(parsed.SESSION_LIFETIME_DAYS).toBe(90)
    expect(parsed.NODE_ENV).toBe('development')
  })

  it('coerces numeric variables, which arrive as strings', () => {
    expect(environmentSchema.parse({ ...valid, PORT: '8080' }).PORT).toBe(8080)
  })

  it('refuses a missing database url', () => {
    expect(() => environmentSchema.parse({ ...valid, DATABASE_URL: undefined })).toThrow()
  })

  it('refuses origins that cannot hold a session together', () => {
    expect(() =>
      environmentSchema.parse({
        ...valid,
        FRONTEND_ORIGIN: 'https://gym-tracker.vercel.app',
        API_ORIGIN: 'https://api.railway.app',
      }),
    ).toThrow(/registrable domain/)
  })

  it('refuses an origin that is not a url', () => {
    expect(() => environmentSchema.parse({ ...valid, API_ORIGIN: 'not-a-url' })).toThrow()
  })
})

describe('optional push configuration', () => {
  it('accepts a deployment with no VAPID keys at all', () => {
    const parsed = environmentSchema.parse(valid)

    expect(parsed.VAPID_PUBLIC_KEY).toBeUndefined()
  })

  it('treats an empty variable as absent, which is how Compose passes an unset one', () => {
    const parsed = environmentSchema.parse({
      ...valid,
      VAPID_PUBLIC_KEY: '',
      VAPID_PRIVATE_KEY: '',
      VAPID_SUBJECT: '',
    })

    expect(parsed.VAPID_PUBLIC_KEY).toBeUndefined()
    expect(parsed.VAPID_SUBJECT).toBeUndefined()
  })

  it('keeps keys that were actually provided', () => {
    const parsed = environmentSchema.parse({
      ...valid,
      VAPID_PUBLIC_KEY: 'a-public-key',
      VAPID_PRIVATE_KEY: 'a-private-key',
      VAPID_SUBJECT: 'you@example.com',
    })

    expect(parsed.VAPID_PUBLIC_KEY).toBe('a-public-key')
    expect(parsed.VAPID_SUBJECT).toBe('mailto:you@example.com')
  })
})
