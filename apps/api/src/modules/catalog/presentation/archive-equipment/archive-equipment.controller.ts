import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ArchiveEquipmentUseCase } from '@api/modules/catalog/application/use-cases/archive-equipment.use-case.js'
import {
  type EquipmentView,
  toEquipmentView,
} from '@api/modules/catalog/presentation/equipment.view.js'
import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common'

/** No DTO: the only input is the identifier in the path. */
@Controller('equipment')
export class ArchiveEquipmentController {
  constructor(private readonly archiveEquipment: ArchiveEquipmentUseCase) {}

  @Post(':id/archive')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EquipmentView> {
    const archived = await this.archiveEquipment.execute({
      userId,
      equipmentId: id,
    })

    return toEquipmentView(archived)
  }
}
