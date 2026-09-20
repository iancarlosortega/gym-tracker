import type { Clock } from '@gym/domain/auth/ports/clock.port'
import { PushSubscription } from '@gym/domain/push/entities/push-subscription.entity'
import { PushScheduledInThePastError } from '@gym/domain/push/errors'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  InMemoryPushScheduler,
  InMemorySubscriptions,
  ScriptedPushSender,
} from '../../testing/in-memory-push.ts'
import { CancelRestPushUseCase } from './cancel-rest-push.use-case.ts'
import { DispatchDuePushesUseCase } from './dispatch-due-pushes.use-case.ts'
import { ScheduleRestPushUseCase } from './schedule-rest-push.use-case.ts'

const now = new Date('2026-09-20T08:00:00.000Z')
const restEndsAt = new Date('2026-09-20T08:03:00.000Z')

class MovableClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current)
  }

  advanceTo(instant: Date): void {
    this.current = instant
  }
}

const userId = Id.create().value
const setId = Id.create().value

let scheduler: InMemoryPushScheduler
let subscriptions: InMemorySubscriptions
let clock: MovableClock
let schedule: ScheduleRestPushUseCase
let cancel: CancelRestPushUseCase

const device = (endpoint: string) =>
  PushSubscription.create({
    userId: Id.restore(userId),
    endpoint,
    p256dh: 'a-public-key',
    auth: 'an-auth-secret',
  })

beforeEach(() => {
  scheduler = new InMemoryPushScheduler()
  subscriptions = new InMemorySubscriptions()
  clock = new MovableClock(now)
  schedule = new ScheduleRestPushUseCase(scheduler, clock)
  cancel = new CancelRestPushUseCase(scheduler)
})

describe('scheduling a rest alert', () => {
  it('books the buzz for the moment rest ends', async () => {
    const push = await schedule.execute({ userId, setId, fireAt: restEndsAt })

    expect(push.fireAt).toEqual(restEndsAt)
    expect(push.isSent).toBe(false)
  })

  it('refuses a rest that has already finished', async () => {
    await expect(
      schedule.execute({ userId, setId, fireAt: new Date('2026-09-20T07:59:00.000Z') }),
    ).rejects.toThrow(PushScheduledInThePastError)
  })

  it('replaces the alert for a set rather than stacking a second one', async () => {
    await schedule.execute({ userId, setId, fireAt: restEndsAt })
    await schedule.execute({ userId, setId, fireAt: new Date('2026-09-20T08:04:00.000Z') })

    expect(scheduler.pushes.size).toBe(1)
  })
})

describe('dismissing a rest', () => {
  it('cancels the alert, so no buzz arrives', async () => {
    await schedule.execute({ userId, setId, fireAt: restEndsAt })

    await cancel.execute({ setId })

    expect(await scheduler.claimDue(restEndsAt, 10)).toHaveLength(0)
  })

  it('is silent when there was nothing booked', async () => {
    await expect(cancel.execute({ setId })).resolves.toBeUndefined()
  })

  it('leaves another set’s alert alone', async () => {
    const otherSetId = Id.create().value
    await schedule.execute({ userId, setId, fireAt: restEndsAt })
    await schedule.execute({ userId, setId: otherSetId, fireAt: restEndsAt })

    await cancel.execute({ setId })

    expect(scheduler.pushes.size).toBe(1)
  })
})

describe('dispatching due alerts', () => {
  const dispatchAt = (instant: Date, sender: ScriptedPushSender) => {
    clock.advanceTo(instant)
    return new DispatchDuePushesUseCase(scheduler, sender, subscriptions, clock).execute()
  }

  it('sends nothing before the rest is over', async () => {
    await schedule.execute({ userId, setId, fireAt: restEndsAt })
    await subscriptions.save(device('https://push.example/1'))
    const sender = new ScriptedPushSender()

    const result = await dispatchAt(new Date('2026-09-20T08:02:59.000Z'), sender)

    expect(result.sent).toBe(0)
    expect(sender.sent).toHaveLength(0)
  })

  it('buzzes every device the user has registered', async () => {
    await schedule.execute({ userId, setId, fireAt: restEndsAt })
    await subscriptions.save(device('https://push.example/1'))
    await subscriptions.save(device('https://push.example/2'))
    const sender = new ScriptedPushSender()

    const result = await dispatchAt(restEndsAt, sender)

    expect(result.sent).toBe(1)
    expect(sender.sent).toHaveLength(2)
  })

  it('does not send the same alert twice', async () => {
    await schedule.execute({ userId, setId, fireAt: restEndsAt })
    await subscriptions.save(device('https://push.example/1'))
    const sender = new ScriptedPushSender()

    await dispatchAt(restEndsAt, sender)
    const second = await dispatchAt(new Date('2026-09-20T08:03:01.000Z'), sender)

    expect(second.sent).toBe(0)
    expect(sender.sent).toHaveLength(1)
  })

  it('still sends an alert that came due while the server was down', async () => {
    await schedule.execute({ userId, setId, fireAt: restEndsAt })
    await subscriptions.save(device('https://push.example/1'))
    const sender = new ScriptedPushSender()

    // Nothing ticked for ten minutes; the row was waiting the whole time.
    const result = await dispatchAt(new Date('2026-09-20T08:13:00.000Z'), sender)

    expect(result.sent).toBe(1)
  })

  it('marks a subscription the push service has retired', async () => {
    await schedule.execute({ userId, setId, fireAt: restEndsAt })
    await subscriptions.save(device('https://push.example/1'))

    const result = await dispatchAt(restEndsAt, new ScriptedPushSender('gone'))

    expect(result.invalidated).toBe(1)
    expect(await subscriptions.findValidForUser(userId)).toHaveLength(0)
  })

  it('keeps a subscription that merely failed to reach the device', async () => {
    await schedule.execute({ userId, setId, fireAt: restEndsAt })
    await subscriptions.save(device('https://push.example/1'))

    const result = await dispatchAt(restEndsAt, new ScriptedPushSender('failed'))

    expect(result.invalidated).toBe(0)
    expect(await subscriptions.findValidForUser(userId)).toHaveLength(1)
  })

  it('does not retry a rest that is long over', async () => {
    await schedule.execute({ userId, setId, fireAt: restEndsAt })
    await subscriptions.save(device('https://push.example/1'))
    const sender = new ScriptedPushSender('failed')

    await dispatchAt(restEndsAt, sender)
    await dispatchAt(new Date('2026-09-20T08:20:00.000Z'), sender)

    expect(sender.sent).toHaveLength(1)
  })
})
