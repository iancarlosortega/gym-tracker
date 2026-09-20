import type { Database } from '@api/common/persistence/drizzle.repository.js'
import { DATABASE } from '@api/database/database.module.js'
import { SystemClock } from '@api/modules/auth/infrastructure/adapters/system-clock.adapter.js'
import { ArchiveEquipmentUseCase } from '@api/modules/catalog/application/use-cases/archive-equipment.use-case.js'
import { ArchiveExerciseUseCase } from '@api/modules/catalog/application/use-cases/archive-exercise.use-case.js'
import { CorrectBarWeightUseCase } from '@api/modules/catalog/application/use-cases/correct-bar-weight.use-case.js'
import { CreateEquipmentUseCase } from '@api/modules/catalog/application/use-cases/create-equipment.use-case.js'
import { CreateExerciseUseCase } from '@api/modules/catalog/application/use-cases/create-exercise.use-case.js'
import { ListEquipmentUseCase } from '@api/modules/catalog/application/use-cases/list-equipment.use-case.js'
import { ListExercisesUseCase } from '@api/modules/catalog/application/use-cases/list-exercises.use-case.js'
import { RenameEquipmentUseCase } from '@api/modules/catalog/application/use-cases/rename-equipment.use-case.js'
import { RenameExerciseUseCase } from '@api/modules/catalog/application/use-cases/rename-exercise.use-case.js'
import { DrizzleEquipmentRepository } from '@api/modules/catalog/infrastructure/persistence/drizzle-equipment.repository.js'
import { DrizzleExerciseRepository } from '@api/modules/catalog/infrastructure/persistence/drizzle-exercise.repository.js'
import { ArchiveEquipmentController } from '@api/modules/catalog/presentation/archive-equipment/archive-equipment.controller.js'
import { ArchiveExerciseController } from '@api/modules/catalog/presentation/archive-exercise/archive-exercise.controller.js'
import { CorrectBarWeightController } from '@api/modules/catalog/presentation/correct-bar-weight/correct-bar-weight.controller.js'
import { CreateEquipmentController } from '@api/modules/catalog/presentation/create-equipment/create-equipment.controller.js'
import { CreateExerciseController } from '@api/modules/catalog/presentation/create-exercise/create-exercise.controller.js'
import { ListEquipmentController } from '@api/modules/catalog/presentation/list-equipment/list-equipment.controller.js'
import { ListExercisesController } from '@api/modules/catalog/presentation/list-exercises/list-exercises.controller.js'
import { RenameEquipmentController } from '@api/modules/catalog/presentation/rename-equipment/rename-equipment.controller.js'
import { RenameExerciseController } from '@api/modules/catalog/presentation/rename-exercise/rename-exercise.controller.js'
import { Module } from '@nestjs/common'

const EXERCISE_REPOSITORY = Symbol('EXERCISE_REPOSITORY')
const EQUIPMENT_REPOSITORY = Symbol('EQUIPMENT_REPOSITORY')
const CLOCK = Symbol('CATALOG_CLOCK')

@Module({
  controllers: [
    CreateExerciseController,
    RenameExerciseController,
    ArchiveExerciseController,
    ListExercisesController,
    CreateEquipmentController,
    RenameEquipmentController,
    CorrectBarWeightController,
    ArchiveEquipmentController,
    ListEquipmentController,
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
      provide: EQUIPMENT_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleEquipmentRepository(database),
    },
    {
      provide: CreateEquipmentUseCase,
      inject: [EQUIPMENT_REPOSITORY],
      useFactory: (repository: ConstructorParameters<typeof CreateEquipmentUseCase>[0]) =>
        new CreateEquipmentUseCase(repository),
    },
    {
      provide: RenameEquipmentUseCase,
      inject: [EQUIPMENT_REPOSITORY],
      useFactory: (repository: ConstructorParameters<typeof RenameEquipmentUseCase>[0]) =>
        new RenameEquipmentUseCase(repository),
    },
    {
      provide: CorrectBarWeightUseCase,
      inject: [EQUIPMENT_REPOSITORY],
      useFactory: (repository: ConstructorParameters<typeof CorrectBarWeightUseCase>[0]) =>
        new CorrectBarWeightUseCase(repository),
    },
    {
      provide: ArchiveEquipmentUseCase,
      inject: [EQUIPMENT_REPOSITORY, CLOCK],
      useFactory: (
        repository: ConstructorParameters<typeof ArchiveEquipmentUseCase>[0],
        clock: ConstructorParameters<typeof ArchiveEquipmentUseCase>[1],
      ) => new ArchiveEquipmentUseCase(repository, clock),
    },
    {
      provide: ListEquipmentUseCase,
      inject: [EQUIPMENT_REPOSITORY],
      useFactory: (repository: ConstructorParameters<typeof ListEquipmentUseCase>[0]) =>
        new ListEquipmentUseCase(repository),
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
