import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { type PageView, toPageView } from '@api/common/http/page.view.js'
import { ListExercisesUseCase } from '@api/modules/catalog/application/use-cases/list-exercises.use-case.js'
import {
  type ExerciseView,
  toExerciseView,
} from '@api/modules/catalog/presentation/exercise.view.js'
import { Controller, Get, Query } from '@nestjs/common'
import { ListExercisesDto } from './list-exercises.dto.js'

@Controller('exercises')
export class ListExercisesController {
  constructor(private readonly listExercises: ListExercisesUseCase) {}

  @Get()
  async handle(
    @GetUserId() userId: string,
    @Query() query: ListExercisesDto,
  ): Promise<PageView<ExerciseView>> {
    const found = await this.listExercises.execute({
      userId,
      includeArchived: query.includeArchived,
      limit: query.limit,
      offset: query.offset,
    })

    return toPageView(found.map(toExerciseView))
  }
}
