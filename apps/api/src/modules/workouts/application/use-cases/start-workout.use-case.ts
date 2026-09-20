import { ROUTINE_REPOSITORY } from '@api/modules/routines/routines.tokens.js'
import { CLOCK, WORKOUT_SESSION_REPOSITORY } from '@api/modules/workouts/workouts.tokens.js'
import type { Clock } from '@gym/domain/auth/ports/clock.port'
import { RoutineNotFoundError } from '@gym/domain/routines/errors'
import type {
  RoutineCriteriaFields,
  RoutineRepository,
} from '@gym/domain/routines/repositories/routine.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import { WorkoutAlreadyOpenError } from '@gym/domain/workouts/errors'
import type { WorkoutSessionRepository } from '@gym/domain/workouts/repositories/workout-session.repository'
import { Inject, Injectable } from '@nestjs/common'
import { findOpenWorkout } from './find-workout.js'

export interface StartWorkoutInput {
  readonly userId: string
  /** Omitted for an ad hoc workout. */
  readonly routineId?: string | undefined
}

/**
 * Start a workout, from a routine or ad hoc.
 *
 * One use case rather than two, because the only difference is whether a
 * routine is named: the rule that a user has at most one workout open at a
 * time has to hold either way, and splitting it would mean enforcing that
 * rule in two places.
 */
@Injectable()
export class StartWorkoutUseCase {
  constructor(
    @Inject(WORKOUT_SESSION_REPOSITORY) private readonly sessions: WorkoutSessionRepository,
    @Inject(ROUTINE_REPOSITORY) private readonly routines: RoutineRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * An already-open workout is refused rather than closed or joined.
   *
   * Starting a second one would leave the phone with two sessions to log
   * into and no way to say which is current — and the user is standing at a
   * rack when that happens.
   */
  async execute(input: StartWorkoutInput): Promise<WorkoutSession> {
    const open = await findOpenWorkout(this.sessions, input.userId)
    if (open !== null) {
      throw new WorkoutAlreadyOpenError('You already have a workout in progress.')
    }

    const routineId = await this.routineOrFail(input)

    const session = WorkoutSession.start({
      userId: Id.restore(input.userId),
      routineId,
      startedAt: this.clock.now(),
    })

    await this.sessions.save(session)
    return session
  }

  /** A workout may only follow a routine the user owns and has not archived. */
  private async routineOrFail(input: StartWorkoutInput): Promise<Id | null> {
    if (input.routineId === undefined) {
      return null
    }

    const routine = await this.routines.findOne(
      Criteria.create<RoutineCriteriaFields>({
        id: input.routineId,
        userId: input.userId,
        archived: false,
      }),
    )

    if (routine === null) {
      throw new RoutineNotFoundError('That routine does not exist.')
    }
    return routine.id
  }
}
