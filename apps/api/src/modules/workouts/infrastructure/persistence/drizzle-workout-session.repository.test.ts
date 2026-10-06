import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { createTestDatabase, seedReferences } from '@api/database/testing/test-database.js'
import { DrizzleWorkoutSessionRepository } from '@api/modules/workouts/infrastructure/persistence/drizzle-workout-session.repository.js'
import type { PGlite } from '@electric-sql/pglite'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { drizzle } from 'drizzle-orm/pglite'
import { beforeEach, describe, expect, it } from 'vitest'

describe('DrizzleWorkoutSessionRepository.delete', () => {
  const otherSessionId = '0199a1f0-0000-7000-8000-00000000f002'

  let client: PGlite
  let repository: DrizzleWorkoutSessionRepository
  let references: Awaited<ReturnType<typeof seedReferences>>

  beforeEach(async () => {
    client = await createTestDatabase()
    references = await seedReferences(client)
    repository = new DrizzleWorkoutSessionRepository(drizzle(client) as unknown as Database)

    await client.query(
      `INSERT INTO workout_session (id, user_id, started_at) VALUES ($1, $2, NOW())`,
      [otherSessionId, references.userId],
    )
    for (const [id, sessionId] of [
      ['0199a1f0-0000-7000-8000-00000000a001', references.sessionId],
      ['0199a1f0-0000-7000-8000-00000000a002', otherSessionId],
    ]) {
      await client.query(
        `INSERT INTO logged_set (id, session_id, exercise_id, equipment_id, mode, raw_value, raw_unit,
           resolved_grams, snapshot_bar_grams, snapshot_display_unit, reps, logged_at)
         VALUES ($1, $2, $3, $4, 'TOTAL', 60000, 'KG', 60000, NULL, 'KG', 8, NOW())`,
        [id, sessionId, references.exerciseId, references.barbellId],
      )
    }
  })

  async function setsIn(sessionId: string): Promise<number> {
    const result = await client.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM logged_set WHERE session_id = $1',
      [sessionId],
    )
    return result.rows[0]?.count ?? 0
  }

  it('removes the session and every set logged in it', async () => {
    await repository.delete(references.sessionId)

    expect(await repository.findOne(Criteria.create({ id: references.sessionId }))).toBeNull()
    expect(await setsIn(references.sessionId)).toBe(0)
  })

  it('leaves other sessions and their sets alone', async () => {
    await repository.delete(references.sessionId)

    expect(await repository.findOne(Criteria.create({ id: otherSessionId }))).not.toBeNull()
    expect(await setsIn(otherSessionId)).toBe(1)
  })

  it('is silent about a session that is not there', async () => {
    await expect(repository.delete('0199a1f0-0000-7000-8000-00000000ffff')).resolves.toBeUndefined()
  })
})
