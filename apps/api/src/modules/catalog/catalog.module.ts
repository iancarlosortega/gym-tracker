import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { DATABASE } from '@api/database/database.module.js'
import { SystemClock } from '@api/modules/auth/infrastructure/adapters/system-clock.adapter.js'
import { ArchiveExerciseUseCase } from '@api/modules/catalog/application/use-cases/archive-exercise.use-case.js'
import { CreateExerciseUseCase } from '@api/modules/catalog/application/use-cases/create-exercise.use-case.js'
import { ListExercisesUseCase } from '@api/modules/catalog/application/use-cases/list-exercises.use-case.js'
import { RenameExerciseUseCase } from '@api/modules/catalog/application/use-cases/rename-exercise.use-case.js'
import { DrizzleExerciseRepository } from '@api/modules/catalog/infrastructure/persistence/drizzle-exercise.repository.js'
import { ArchiveExerciseController } from '@api/modules/catalog/presentation/archive-exercise/archive-exercise.controller.js'
import { CreateExerciseController } from '@api/modules/catalog/presentation/create-exercise/create-exercise.controller.js'
import { ListExercisesController } from '@api/modules/catalog/presentation/list-exercises/list-exercises.controller.js'
import { RenameExerciseController } from '@api/modules/catalog/presentation/rename-exercise/rename-exercise.controller.js'
import { Module } from '@nestjs/common'

const EXERCISE_REPOSITORY = Symbol('EXERCISE_REPOSITORY')
const CLOCK = Symbol('CATALOG_CLOCK')

@Module({
  controllers: [
    CreateExerciseController,
    RenameExerciseController,
    ArchiveExerciseController,
    ListExercisesController,
  ],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    {
      provide: EXERCISE_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleExerciseRepository(database),
    },
    {
      provide: CreateExerciseUseCase,
      inject: [EXERCISE_REPOSITORY],
      useFactory: (repository: ConstructorParameters<typeof CreateExerciseUseCase>[0]) =>
        new CreateExerciseUseCase(repository),
    },
    {
      provide: RenameExerciseUseCase,
      inject: [EXERCISE_REPOSITORY],
      useFactory: (repository: ConstructorParameters<typeof RenameExerciseUseCase>[0]) =>
        new RenameExerciseUseCase(repository),
    },
    {
      provide: ArchiveExerciseUseCase,
      inject: [EXERCISE_REPOSITORY, CLOCK],
      useFactory: (
        repository: ConstructorParameters<typeof ArchiveExerciseUseCase>[0],
        clock: ConstructorParameters<typeof ArchiveExerciseUseCase>[1],
      ) => new ArchiveExerciseUseCase(repository, clock),
    },
    {
      provide: ListExercisesUseCase,
      inject: [EXERCISE_REPOSITORY],
      useFactory: (repository: ConstructorParameters<typeof ListExercisesUseCase>[0]) =>
        new ListExercisesUseCase(repository),
    },
  ],
})
export class CatalogModule {}
