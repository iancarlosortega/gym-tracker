import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { type PageView, toPageView } from '@api/common/http/page.view.js'
import { ListEquipmentUseCase } from '@api/modules/catalog/application/use-cases/list-equipment.use-case.js'
import {
  type EquipmentView,
  toEquipmentView,
} from '@api/modules/catalog/presentation/equipment.view.js'
import { Controller, Get, Query } from '@nestjs/common'
import { ListEquipmentDto } from './list-equipment.dto.js'

@Controller('equipment')
export class ListEquipmentController {
  constructor(private readonly listEquipment: ListEquipmentUseCase) {}

  @Get()
  async handle(
    @GetUserId() userId: string,
    @Query() query: ListEquipmentDto,
  ): Promise<PageView<EquipmentView>> {
    const found = await this.listEquipment.execute({
      userId,
      kind: query.kind,
      includeArchived: query.includeArchived,
      limit: query.limit,
      offset: query.offset,
    })

    return toPageView(found.map(toEquipmentView))
  }
}
