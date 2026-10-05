import type { SetRepository } from '@gym/domain/measurement/repositories/set.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import { queryOptions } from '@tanstack/react-query'
import { offlineWork } from '../../workouts/presentation/offline-work'
import { workoutsKeys } from '../../workouts/presentation/queries'
import { getSessionSets } from '../infrastructure/session-sets.api'
import { type DoneSet, fromQueue, fromServer, mergeDone } from './workout/done-sets'

const WHOLE_WORKOUT = Pagination.create({ limit: 200 })

/**
 * Every set a workout has logged: what the server confirmed, plus what the
 * phone still holds. Read with no network too, so the server's part is simply
 * left out when it cannot be reached.
 */
export const sessionSetsQuery = (sessionId: string, queue: SetRepository = offlineWork().sets) =>
  queryOptions({
    queryKey: workoutsKeys.sessionSets(sessionId),
    queryFn: async (): Promise<readonly DoneSet[]> => {
      const [server, queued] = await Promise.all([
        getSessionSets(sessionId).catch(() => []),
        queue.findMany(Criteria.create({ sessionId }), WHOLE_WORKOUT),
      ])
      return mergeDone(server.map(fromServer), queued.items.map(fromQueue))
    },
    networkMode: 'always',
  })
