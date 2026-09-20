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
import {
  CLOCK,
  EQUIPMENT_REPOSITORY,
  EXERCISE_REPOSITORY,
} from '@api/modules/catalog/catalog.tokens.js'
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

/**
 * Composition root for the catalog.
 *
 * Every port is bound to its adapter here and nowhere else; the use cases
 * declare the token they need and Nest builds them.
 */
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
    { provide: EXERCISE_REPOSITORY, useClass: DrizzleExerciseRepository },
    { provide: EQUIPMENT_REPOSITORY, useClass: DrizzleEquipmentRepository },
    CreateExerciseUseCase,
    RenameExerciseUseCase,
    ArchiveExerciseUseCase,
    ListExercisesUseCase,
    CreateEquipmentUseCase,
    RenameEquipmentUseCase,
    CorrectBarWeightUseCase,
    ArchiveEquipmentUseCase,
    ListEquipmentUseCase,
  ],
})
export class CatalogModule {}
