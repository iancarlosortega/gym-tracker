import { queryOptions, useQuery } from '@tanstack/react-query'
import { getExerciseProgression, getWeekComparison } from '../infrastructure/statistics.api'

/** Dates are keyed as ISO strings, so equal instants share a cache entry. */
export const statisticsKeys = {
  all: ['statistics'] as const,
  week: (weekStart: string) => [...statisticsKeys.all, 'week', weekStart] as const,
  progression: (exerciseId: string, from: string, to: string) =>
    [...statisticsKeys.all, 'progression', exerciseId, from, to] as const,
}

export const weekComparisonQuery = (weekStart: Date) =>
  queryOptions({
    queryKey: statisticsKeys.week(weekStart.toISOString()),
    queryFn: () => getWeekComparison(weekStart),
  })

export const exerciseProgressionQuery = (exerciseId: string, from: Date, to: Date) =>
  queryOptions({
    queryKey: statisticsKeys.progression(exerciseId, from.toISOString(), to.toISOString()),
    queryFn: () => getExerciseProgression(exerciseId, from, to),
  })

export const useWeekComparison = (weekStart: Date) => useQuery(weekComparisonQuery(weekStart))

export const useExerciseProgression = (exerciseId: string, from: Date, to: Date) =>
  useQuery(exerciseProgressionQuery(exerciseId, from, to))
