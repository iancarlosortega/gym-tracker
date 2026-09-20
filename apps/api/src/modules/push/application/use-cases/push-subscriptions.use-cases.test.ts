import { PushSubscription } from '@gym/domain/push/entities/push-subscription.entity'
import { InvalidPushSubscriptionError } from '@gym/domain/push/errors'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { ConfigService } from '@nestjs/config'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemorySubscriptions } from '../../testing/in-memory-push.ts'
import { ReadPushStateUseCase } from './read-push-state.use-case.ts'
import { RegisterPushSubscriptionUseCase } from './register-push-subscription.use-case.ts'

const userId = Id.create().value
const endpoint = 'https://push.example/device-1'

let subscriptions: InMemorySubscriptions
let register: RegisterPushSubscriptionUseCase

const configuredWith = (publicKey: string | undefined) =>
  new ReadPushStateUseCase(subscriptions, {
    get: () => publicKey,
  } as unknown as ConfigService)

beforeEach(() => {
  subscriptions = new InMemorySubscriptions()
  register = new RegisterPushSubscriptionUseCase(subscriptions)
})

describe('registering a device', () => {
  it('remembers it for the user who registered it', async () => {
    await register.execute({ userId, endpoint, p256dh: 'a-key', auth: 'a-secret' })

    expect(await subscriptions.findValidForUser(userId)).toHaveLength(1)
  })

  it('refuses a subscription missing its keys', async () => {
    await expect(
      register.execute({ userId, endpoint, p256dh: '', auth: 'a-secret' }),
    ).rejects.toThrow(InvalidPushSubscriptionError)
  })

  it('revives a subscription the push service had retired', async () => {
    const retired = PushSubscription.create({
      userId: Id.restore(userId),
      endpoint,
      p256dh: 'a-key',
      auth: 'a-secret',
    }).invalidatedAt(new Date('2026-09-20T08:00:00.000Z'))
    await subscriptions.save(retired)

    // The browser hands back the same endpoint when permission is granted again.
    await register.execute({ userId, endpoint, p256dh: 'a-key', auth: 'a-secret' })

    expect(await subscriptions.findValidForUser(userId)).toHaveLength(1)
  })
})

describe('reading what the client should disclose', () => {
  it('reports a working subscription', async () => {
    await register.execute({ userId, endpoint, p256dh: 'a-key', auth: 'a-secret' })

    const state = await configuredWith('a-public-key').execute(userId)

    expect(state).toEqual({ publicKey: 'a-public-key', subscribed: true, invalidated: false })
  })

  it('separates never having subscribed from having been retired', async () => {
    const never = await configuredWith('a-public-key').execute(userId)
    expect(never.invalidated).toBe(false)

    await register.execute({ userId, endpoint, p256dh: 'a-key', auth: 'a-secret' })
    const registered = await subscriptions.findByEndpoint(endpoint)
    if (registered === null) {
      throw new Error('The subscription just registered is not there.')
    }
    await subscriptions.save(registered.invalidatedAt(new Date()))

    const retired = await configuredWith('a-public-key').execute(userId)
    expect(retired).toMatchObject({ subscribed: false, invalidated: true })
  })

  it('offers no key when the server has none, so the client cannot promise alerts', async () => {
    expect((await configuredWith(undefined).execute(userId)).publicKey).toBeNull()
  })
})
