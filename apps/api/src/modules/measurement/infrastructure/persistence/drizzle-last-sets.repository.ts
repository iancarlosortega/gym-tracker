import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { DATABASE } from '@api/database/database.module.js'
import { loggedSet } from '@api/database/schema/logged-set.table.js'
import { workoutSession } from '@api/database/schema/workout-session.table.js'
import type {
  LastSession,
  LastSetsRepository,
} from '@gym/domain/measurement/repositories/last-sets.repository'
import { Inject, Injectable } from '@nestjs/common'
import { and, asc, desc, eq, isNull, ne, type SQL } from 'drizzle-orm'
import { setMapper } from './set.mapper.js'

/**
 * Two reads: the user's most recent other session with a live set of the
 * exercise, then that session's sets of it in logged order. Ownership is on
 * the session, so both reads go through it.
 */
@Injectable()
export class DrizzleLastSetsRepository implements LastSetsRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async lastSession(
    userId: string,
    exerciseId: string,
    excludingSessionId: string | null,
  ): Promise<LastSession | null> {
    const conditions: SQL[] = [
      eq(workoutSession.userId, userId),
      eq(loggedSet.exerciseId, exerciseId),
      isNull(loggedSet.deletedAt),
    ]
    if (excludingSessionId !== null) conditions.push(ne(workoutSession.id, excludingSessionId))

    const [latest] = await this.database
      .select({ id: workoutSession.id, startedAt: workoutSession.startedAt })
      .from(workoutSession)
      .innerJoin(loggedSet, eq(loggedSet.sessionId, workoutSession.id))
      .where(and(...conditions))
      .orderBy(desc(workoutSession.startedAt))
      .limit(1)

    if (latest === undefined) return null

    const rows = await this.database
      .select()
      .from(loggedSet)
      .where(
        and(
          eq(loggedSet.sessionId, latest.id),
          eq(loggedSet.exerciseId, exerciseId),
          isNull(loggedSet.deletedAt),
        ),
      )
      .orderBy(asc(loggedSet.loggedAt))

    return {
      sessionStartedAt: new Date(latest.startedAt),
      sets: (rows as (typeof loggedSet.$inferSelect)[]).map((row) => setMapper.toDomain(row)),
    }
  }
}
