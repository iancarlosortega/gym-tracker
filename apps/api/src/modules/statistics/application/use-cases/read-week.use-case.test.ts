import type { DateRange } from '@gym/domain/shared/value-objects/date-range.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import type { StatisticsRepository } from '@gym/domain/statistics/repositories/statistics.repository'
import { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import { describe, expect, it } from 'vitest'
import { ReadWeekUseCase } from './read-week.use-case.ts'

const userId = Id.create()

const workoutAt = (instant: string) =>
  WorkoutSession.start({ userId, startedAt: new Date(instant) })

/** Answers with whichever workouts fall inside the period asked for, as the database does. */
const statisticsWith = (sessions: readonly WorkoutSession[]): StatisticsRepository => ({
  setsInPeriod: async () => [],
  setsForExercise: async () => [],
  sessionsInPeriod: async (_userId: string, period: DateRange) =>
    sessions.filter(
      (session) => session.startedAt >= period.start && session.startedAt <= period.end,
    ),
  plannedSetsByRoutine: async () => new Map(),
})

describe('the days trained this week', () => {
  it('lists each day with a workout once, in order, and only this week', async () => {
    const readWeek = new ReadWeekUseCase(
      statisticsWith([
        workoutAt('2026-10-01T18:00:00Z'),
        workoutAt('2026-09-29T07:00:00Z'),
        workoutAt('2026-09-29T19:00:00Z'),
        workoutAt('2026-09-24T07:00:00Z'),
      ]),
    )

    const week = await readWeek.execute({
      userId: userId.value,
      weekStart: new Date('2026-09-28T00:00:00Z'),
    })

    expect(week.trainedOn).toEqual(['2026-09-29', '2026-10-01'])
  })

  it('is empty for a week with no workouts', async () => {
    const week = await new ReadWeekUseCase(statisticsWith([])).execute({
      userId: userId.value,
      weekStart: new Date('2026-09-28T00:00:00Z'),
    })

    expect(week.trainedOn).toEqual([])
  })
})

describe("the week in the phone's time zone", () => {
  const guayaquil = 'America/Guayaquil'

  it('marks a Sunday-evening workout on Sunday, in the week it was done', async () => {
    // 20:24 on Sunday 4 October in Guayaquil.
    const readWeek = new ReadWeekUseCase(statisticsWith([workoutAt('2026-10-05T01:24:20.089Z')]))

    const week = await readWeek.execute({
      userId: userId.value,
      weekStart: new Date('2026-09-28T05:00:00Z'),
      timeZone: guayaquil,
    })

    expect(week.trainedOn).toEqual(['2026-10-04'])
  })

  it('leaves that workout out of the week that starts on the local Monday after it', async () => {
    const readWeek = new ReadWeekUseCase(statisticsWith([workoutAt('2026-10-05T01:24:20.089Z')]))

    const week = await readWeek.execute({
      userId: userId.value,
      weekStart: new Date('2026-10-05T05:00:00Z'),
      timeZone: guayaquil,
    })

    expect(week.trainedOn).toEqual([])
  })

  it('reads the week holding the instant it is given, whatever time of day it is', async () => {
    const readWeek = new ReadWeekUseCase(statisticsWith([workoutAt('2026-10-05T01:24:20.089Z')]))

    // Wednesday noon local: the whole week around it, Monday to Sunday night.
    const week = await readWeek.execute({
      userId: userId.value,
      weekStart: new Date('2026-09-30T17:00:00Z'),
      timeZone: guayaquil,
    })

    expect(week.trainedOn).toEqual(['2026-10-04'])
  })
})
