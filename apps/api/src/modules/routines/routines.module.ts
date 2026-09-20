import { SystemClock } from '@api/modules/auth/infrastructure/adapters/system-clock.adapter.js'
import { DrizzleEquipmentRepository } from '@api/modules/catalog/infrastructure/persistence/drizzle-equipment.repository.js'
import { DrizzleExerciseRepository } from '@api/modules/catalog/infrastructure/persistence/drizzle-exercise.repository.js'
import { AddRoutineExerciseUseCase } from '@api/modules/routines/application/use-cases/add-routine-exercise.use-case.js'
import { ArchiveRoutineUseCase } from '@api/modules/routines/application/use-cases/archive-routine.use-case.js'
import { ChangeRoutineEntryUseCase } from '@api/modules/routines/application/use-cases/change-routine-entry.use-case.js'
import { CreateRoutineUseCase } from '@api/modules/routines/application/use-cases/create-routine.use-case.js'
import { GetRoutineUseCase } from '@api/modules/routines/application/use-cases/get-routine.use-case.js'
import { ListRoutinesUseCase } from '@api/modules/routines/application/use-cases/list-routines.use-case.js'
import { RemoveRoutineEntryUseCase } from '@api/modules/routines/application/use-cases/remove-routine-entry.use-case.js'
import { RenameRoutineUseCase } from '@api/modules/routines/application/use-cases/rename-routine.use-case.js'
import { ReorderRoutineUseCase } from '@api/modules/routines/application/use-cases/reorder-routine.use-case.js'
import { DrizzleRoutineRepository } from '@api/modules/routines/infrastructure/persistence/drizzle-routine.repository.js'
import { AddRoutineExerciseController } from '@api/modules/routines/presentation/add-routine-exercise/add-routine-exercise.controller.js'
import { ArchiveRoutineController } from '@api/modules/routines/presentation/archive-routine/archive-routine.controller.js'
import { ChangeRoutineEntryController } from '@api/modules/routines/presentation/change-routine-entry/change-routine-entry.controller.js'
import { CreateRoutineController } from '@api/modules/routines/presentation/create-routine/create-routine.controller.js'
import { GetRoutineController } from '@api/modules/routines/presentation/get-routine/get-routine.controller.js'
import { ListRoutinesController } from '@api/modules/routines/presentation/list-routines/list-routines.controller.js'
import { RemoveRoutineEntryController } from '@api/modules/routines/presentation/remove-routine-entry/remove-routine-entry.controller.js'
import { RenameRoutineController } from '@api/modules/routines/presentation/rename-routine/rename-routine.controller.js'
import { ReorderRoutineController } from '@api/modules/routines/presentation/reorder-routine/reorder-routine.controller.js'
import {
  CLOCK,
  EQUIPMENT_REPOSITORY,
  EXERCISE_REPOSITORY,
  ROUTINE_REPOSITORY,
} from '@api/modules/routines/routines.tokens.js'
import { Module } from '@nestjs/common'

@Module({
  controllers: [
    CreateRoutineController,
    RenameRoutineController,
    ArchiveRoutineController,
    GetRoutineController,
    ListRoutinesController,
    AddRoutineExerciseController,
    RemoveRoutineEntryController,
    ReorderRoutineController,
    ChangeRoutineEntryController,
  ],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: ROUTINE_REPOSITORY, useClass: DrizzleRoutineRepository },
    { provide: EXERCISE_REPOSITORY, useClass: DrizzleExerciseRepository },
    { provide: EQUIPMENT_REPOSITORY, useClass: DrizzleEquipmentRepository },
    CreateRoutineUseCase,
    RenameRoutineUseCase,
    ArchiveRoutineUseCase,
    GetRoutineUseCase,
    ListRoutinesUseCase,
    AddRoutineExerciseUseCase,
    RemoveRoutineEntryUseCase,
    ReorderRoutineUseCase,
    ChangeRoutineEntryUseCase,
  ],
})
export class RoutinesModule {}
