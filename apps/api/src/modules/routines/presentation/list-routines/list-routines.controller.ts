import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { type PageView, toPageView } from '@api/common/http/page.view.js'
import { ListRoutinesUseCase } from '@api/modules/routines/application/use-cases/list-routines.use-case.js'
import { type RoutineView, toRoutineView } from '@api/modules/routines/presentation/routine.view.js'
import { Controller, Get, Query } from '@nestjs/common'
import { ListRoutinesDto } from './list-routines.dto.js'

@Controller('routines')
export class ListRoutinesController {
  constructor(private readonly listRoutines: ListRoutinesUseCase) {}

  @Get()
  async handle(
    @GetUserId() userId: string,
    @Query() query: ListRoutinesDto,
  ): Promise<PageView<RoutineView>> {
    const found = await this.listRoutines.execute({
      userId,
      includeArchived: query.includeArchived,
      limit: query.limit,
      offset: query.offset,
    })

    return toPageView(found.map(toRoutineView))
  }
}
