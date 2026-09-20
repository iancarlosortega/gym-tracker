import { AuthModule } from '@api/modules/auth/auth.module.js'
import { CatalogModule } from '@api/modules/catalog/catalog.module.js'
import { LogSetsUseCase } from '@api/modules/measurement/application/use-cases/log-sets.use-case.js'
import { DrizzleSetRepository } from '@api/modules/measurement/infrastructure/persistence/drizzle-set.repository.js'
import { SET_REPOSITORY } from '@api/modules/measurement/measurement.tokens.js'
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
  controllers: [LogSetsController],
  providers: [{ provide: SET_REPOSITORY, useClass: DrizzleSetRepository }, LogSetsUseCase],
  exports: [SET_REPOSITORY],
})
export class MeasurementModule {}
