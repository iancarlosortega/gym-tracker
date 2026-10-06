import type { SetCriteriaFields } from '@gym/domain/measurement/repositories/set.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { localTimeZone } from '@/lib/local-time'
import { lastSetsKeys } from '../../measurement/presentation/last-sets.queries'
import { routinesKeys } from '../../routines/presentation/queries'
import { statisticsKeys } from '../../statistics/presentation/queries'
import { workoutsKeys } from '../../workouts/presentation/queries'
import { deleteWorkout, getWorkout, getWorkoutHistory } from '../infrastructure/history.api'
import { type Month, monthBounds } from './history-calendar'

const PAGE_SIZE = 20
/** A month holds far fewer workouts than this, so one read is the whole month. */
const WHOLE_MONTH = 200
const WHOLE_WORKOUT = Pagination.create({ limit: 200 })

export const historyKeys = {
  all: ['history'] as const,
  list: () => [...historyKeys.all, 'list'] as const,
  month: (month: Month, zone: string) => [...historyKeys.all, 'month', month, zone] as const,
  workout: (workoutId: string) => [...historyKeys.all, 'workout', workoutId] as const,
}

/** Newest first, twenty at a time, each page starting where the last stopped. */
export const useWorkoutHistory = () =>
  useInfiniteQuery({
    queryKey: historyKeys.list(),
    queryFn: ({ pageParam }) => getWorkoutHistory({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  })

/** One calendar month in the phone's zone. */
export const useMonthHistory = (month: Month, zone = localTimeZone()) =>
  useQuery({
    queryKey: historyKeys.month(month, zone),
    queryFn: () => getWorkoutHistory({ limit: WHOLE_MONTH, ...monthBounds(month, zone) }),
  })

export const useWorkoutSummary = (workoutId: string) =>
  useQuery({ queryKey: historyKeys.workout(workoutId), queryFn: () => getWorkout(workoutId) })

/** What the phone may still hold for a workout: queued sets and a queued finish. */
export interface LocalWorkoutStores {
  readonly sets: {
    findMany(
      criteria: Criteria<SetCriteriaFields>,
      pagination: Pagination,
    ): Promise<{ readonly items: readonly { readonly id: string }[] }>
    delete(id: string): Promise<void>
  }
  readonly finishes: { delete(sessionId: string): Promise<void> }
}

/**
 * Delete a workout once the server agrees: it takes its sets with it, so it is
 * never shown as gone before it is.
 *
 * Whatever the phone still holds for it goes first, so a queued set cannot
 * be sent to a workout that no longer exists.
 */
export const useDeleteWorkout = (stores: LocalWorkoutStores) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: async (workoutId: string) => {
      const queued = await stores.sets.findMany(
        Criteria.create<SetCriteriaFields>({ sessionId: workoutId }),
        WHOLE_WORKOUT,
      )
      await Promise.all(queued.items.map((set) => stores.sets.delete(set.id)))
      await stores.finishes.delete(workoutId)
      await deleteWorkout(workoutId)
    },
    onSuccess: () =>
      Promise.all(
        [
          historyKeys.all,
          statisticsKeys.all,
          routinesKeys.all,
          lastSetsKeys.all,
          workoutsKeys.current(),
          workoutsKeys.pendingSets(),
        ].map((queryKey) => client.invalidateQueries({ queryKey })),
      ),
  })
}
