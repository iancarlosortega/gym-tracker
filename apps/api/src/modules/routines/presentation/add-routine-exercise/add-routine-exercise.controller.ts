import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { AddRoutineExerciseUseCase } from '@api/modules/routines/application/use-cases/add-routine-exercise.use-case.js'
import { type RoutineView, toRoutineView } from '@api/modules/routines/presentation/routine.view.js'
import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { AddRoutineExerciseDto } from './add-routine-exercise.dto.js'

@Controller('routines')
export class AddRoutineExerciseController {
  constructor(private readonly addRoutineExercise: AddRoutineExerciseUseCase) {}

  @Post(':id/exercises')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddRoutineExerciseDto,
  ): Promise<RoutineView> {
    return toRoutineView(
      await this.addRoutineExercise.execute({
        userId,
        routineId: id,
        exerciseId: body.exerciseId,
        equipmentId: body.equipmentId,
        targetSets: body.targetSets,
        targetRepsMin: body.targetRepsMin,
        targetRepsMax: body.targetRepsMax,
        restSeconds: body.restSeconds,
      }),
    )
  }
}
