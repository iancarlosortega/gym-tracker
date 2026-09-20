import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { RenameEquipmentUseCase } from '@api/modules/catalog/application/use-cases/rename-equipment.use-case.js'
import {
  type EquipmentView,
  toEquipmentView,
} from '@api/modules/catalog/presentation/equipment.view.js'
import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { RenameEquipmentDto } from './rename-equipment.dto.js'

@Controller('equipment')
export class RenameEquipmentController {
  constructor(private readonly renameEquipment: RenameEquipmentUseCase) {}

  @Patch(':id')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RenameEquipmentDto,
  ): Promise<EquipmentView> {
    const renamed = await this.renameEquipment.execute({
      userId,
      equipmentId: id,
      name: body.name,
    })

    return toEquipmentView(renamed)
  }
}
