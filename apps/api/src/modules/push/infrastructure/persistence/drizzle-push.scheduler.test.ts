import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { createTestDatabase, seedReferences } from '@api/database/testing/test-database.js'
import { DrizzlePushScheduler } from '@api/modules/push/infrastructure/persistence/drizzle-push.scheduler.js'
import { ScheduledPush } from '@gym/domain/push/entities/scheduled-push.entity'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { drizzle } from 'drizzle-orm/pglite'
import { beforeEach, describe, expect, it } from 'vitest'

const now = new Date('2026-09-20T08:00:00.000Z')
const restEndsAt = new Date('2026-09-20T08:03:00.000Z')

let scheduler: DrizzlePushScheduler
let userId: string

const alertFor = (setId: string, fireAt = restEndsAt) =>
  ScheduledPush.schedule({
    userId: Id.restore(userId),
    setId: Id.restore(setId),
    fireAt,
    now,
  })

beforeEach(async () => {
  const client = await createTestDatabase()
  const references = await seedReferences(client)

  userId = references.userId
  scheduler = new DrizzlePushScheduler(drizzle(client) as unknown as Database)
})

describe('rest alerts in the database', () => {
  it('survives a restart: the row is still waiting when the process comes back', async () => {
    await scheduler.schedule(alertFor(Id.create().value))

    // Nothing in memory carried over; the only state is the row itself.
    const due = await scheduler.claimDue(restEndsAt, 10)

    expect(due).toHaveLength(1)
  })

  it('hands back nothing before the rest is over', async () => {
    await scheduler.schedule(alertFor(Id.create().value))

    expect(await scheduler.claimDue(new Date('2026-09-20T08:02:59.000Z'), 10)).toHaveLength(0)
  })

  it('stops handing back an alert once it is marked sent', async () => {
    const push = alertFor(Id.create().value)
    await scheduler.schedule(push)

    await scheduler.markSent(push.sentAt(restEndsAt))

    expect(await scheduler.claimDue(restEndsAt, 10)).toHaveLength(0)
  })

  it('cancels by set, which is what the user dismissed', async () => {
    const dismissed = Id.create().value
    await scheduler.schedule(alertFor(dismissed))
    await scheduler.schedule(alertFor(Id.create().value))

    await scheduler.cancelForSet(dismissed)

    const due = await scheduler.claimDue(restEndsAt, 10)
    expect(due).toHaveLength(1)
    expect(due[0]?.setId.value).not.toBe(dismissed)
  })

  it('keeps the evidence of an alert that was already sent', async () => {
    const setId = Id.create().value
    const push = alertFor(setId)
    await scheduler.schedule(push)
    await scheduler.markSent(push.sentAt(restEndsAt))

    // Cancelling a rest whose buzz already went out must not erase the record.
    await scheduler.cancelForSet(setId)

    expect(await scheduler.claimDue(restEndsAt, 10)).toHaveLength(0)
  })

  it('takes the oldest alerts first and honours the claim limit', async () => {
    await scheduler.schedule(alertFor(Id.create().value, new Date('2026-09-20T08:05:00.000Z')))
    await scheduler.schedule(alertFor(Id.create().value, new Date('2026-09-20T08:01:00.000Z')))

    const due = await scheduler.claimDue(new Date('2026-09-20T08:06:00.000Z'), 1)

    expect(due).toHaveLength(1)
    expect(due[0]?.fireAt).toEqual(new Date('2026-09-20T08:01:00.000Z'))
  })
})
