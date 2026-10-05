import { queryOptions, useQuery } from '@tanstack/react-query'
import { localTimeZone } from '@/lib/local-time'
import { getExerciseProgression, getWeekComparison } from '../infrastructure/statistics.api'

/**
 * Dates are keyed as ISO strings, so equal instants share a cache entry, and
 * every key carries the phone's zone: the same week reads differently elsewhere.
 */
export const statisticsKeys = {
  all: ['statistics'] as const,
  week: (weekStart: string, timeZone: string) =>
    [...statisticsKeys.all, 'week', weekStart, timeZone] as const,
  progression: (exerciseId: string, from: string, to: string, timeZone: string) =>
    [...statisticsKeys.all, 'progression', exerciseId, from, to, timeZone] as const,
}

export const weekComparisonQuery = (weekStart: Date, timeZone = localTimeZone()) =>
  queryOptions({
    queryKey: statisticsKeys.week(weekStart.toISOString(), timeZone),
    queryFn: () => getWeekComparison(weekStart, timeZone),
  })

export const exerciseProgressionQuery = (
  exerciseId: string,
  from: Date,
  to: Date,
  timeZone = localTimeZone(),
) =>
  queryOptions({
    queryKey: statisticsKeys.progression(
      exerciseId,
      from.toISOString(),
      to.toISOString(),
      timeZone,
    ),
    queryFn: () => getExerciseProgression(exerciseId, from, to, timeZone),
  })

export const useWeekComparison = (weekStart: Date) => useQuery(weekComparisonQuery(weekStart))

export const useExerciseProgression = (exerciseId: string, from: Date, to: Date) =>
  useQuery(exerciseProgressionQuery(exerciseId, from, to))
