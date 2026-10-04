import { AuthModule } from '@api/modules/auth/auth.module.js'
import { CatalogModule } from '@api/modules/catalog/catalog.module.js'
import { GetLastSetsUseCase } from '@api/modules/measurement/application/use-cases/get-last-sets.use-case.js'
import { ListSessionSetsUseCase } from '@api/modules/measurement/application/use-cases/list-session-sets.use-case.js'
import { LogSetsUseCase } from '@api/modules/measurement/application/use-cases/log-sets.use-case.js'
import { DrizzleLastSetsRepository } from '@api/modules/measurement/infrastructure/persistence/drizzle-last-sets.repository.js'
import { DrizzleSetRepository } from '@api/modules/measurement/infrastructure/persistence/drizzle-set.repository.js'
import {
  LAST_SETS_REPOSITORY,
  SET_REPOSITORY,
} from '@api/modules/measurement/measurement.tokens.js'
import { GetLastSetsController } from '@api/modules/measurement/presentation/get-last-sets/get-last-sets.controller.js'
import { ListSessionSetsController } from '@api/modules/measurement/presentation/list-session-sets/list-session-sets.controller.js'
import { LogSetsController } from '@api/modules/measurement/presentation/log-sets/log-sets.controller.js'
import { WorkoutsModule } from '@api/modules/workouts/workouts.module.js'
import { Module } from '@nestjs/common'

/**
 * Composition root for measurement.
 *
 * Logging a set is the one place four contexts meet: the workout it belongs
 * to, the exercise that decides how it is read, the equipment it was lifted
 * on, and the account whose display unit is recorded on it. Each arrives
 * through the module that owns it.
 */
@Module({
  imports: [WorkoutsModule, CatalogModule, AuthModule],
  controllers: [LogSetsController, GetLastSetsController, ListSessionSetsController],
  providers: [
    { provide: SET_REPOSITORY, useClass: DrizzleSetRepository },
    { provide: LAST_SETS_REPOSITORY, useClass: DrizzleLastSetsRepository },
    LogSetsUseCase,
    GetLastSetsUseCase,
    ListSessionSetsUseCase,
  ],
  exports: [SET_REPOSITORY],
})
export class MeasurementModule {}
