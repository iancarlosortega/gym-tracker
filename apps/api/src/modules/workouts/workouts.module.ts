import { SystemClock } from '@api/modules/auth/infrastructure/adapters/system-clock.adapter.js'
import { RoutinesModule } from '@api/modules/routines/routines.module.js'
import { FinishWorkoutUseCase } from '@api/modules/workouts/application/use-cases/finish-workout.use-case.js'
import { ListWorkoutsUseCase } from '@api/modules/workouts/application/use-cases/list-workouts.use-case.js'
import { ResumeWorkoutUseCase } from '@api/modules/workouts/application/use-cases/resume-workout.use-case.js'
import { StartWorkoutUseCase } from '@api/modules/workouts/application/use-cases/start-workout.use-case.js'
import { DrizzleWorkoutHistoryRepository } from '@api/modules/workouts/infrastructure/persistence/drizzle-workout-history.repository.js'
import { DrizzleWorkoutSessionRepository } from '@api/modules/workouts/infrastructure/persistence/drizzle-workout-session.repository.js'
import { FinishWorkoutController } from '@api/modules/workouts/presentation/finish-workout/finish-workout.controller.js'
import { ListWorkoutsController } from '@api/modules/workouts/presentation/list-workouts/list-workouts.controller.js'
import { ResumeWorkoutController } from '@api/modules/workouts/presentation/resume-workout/resume-workout.controller.js'
import { StartWorkoutController } from '@api/modules/workouts/presentation/start-workout/start-workout.controller.js'
import {
  CLOCK,
  WORKOUT_HISTORY_REPOSITORY,
  WORKOUT_SESSION_REPOSITORY,
} from '@api/modules/workouts/workouts.tokens.js'
import { Module } from '@nestjs/common'

/**
 * Composition root for workouts.
 *
 * Every port is bound to its adapter here and nowhere else; the use cases
 * declare the token they need and Nest builds them. The routine repository
 * arrives from RoutinesModule, because starting from a plan has to check the
 * plan the routines module owns.
 */
@Module({
  imports: [RoutinesModule],
  controllers: [
    StartWorkoutController,
    ResumeWorkoutController,
    FinishWorkoutController,
    ListWorkoutsController,
  ],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: WORKOUT_SESSION_REPOSITORY, useClass: DrizzleWorkoutSessionRepository },
    { provide: WORKOUT_HISTORY_REPOSITORY, useClass: DrizzleWorkoutHistoryRepository },
    StartWorkoutUseCase,
    ResumeWorkoutUseCase,
    FinishWorkoutUseCase,
    ListWorkoutsUseCase,
  ],
  exports: [WORKOUT_SESSION_REPOSITORY],
})
export class WorkoutsModule {}
