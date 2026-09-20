import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { CreateEquipmentUseCase } from '@api/modules/catalog/application/use-cases/create-equipment.use-case.js'
import {
  type EquipmentView,
  toEquipmentView,
} from '@api/modules/catalog/presentation/equipment.view.js'
import { Body, Controller, Post } from '@nestjs/common'
import { CreateEquipmentDto } from './create-equipment.dto.js'

@Controller('equipment')
export class CreateEquipmentController {
  constructor(private readonly createEquipment: CreateEquipmentUseCase) {}

  @Post()
  async handle(
    @GetUserId() userId: string,
    @Body() body: CreateEquipmentDto,
  ): Promise<EquipmentView> {
    const created = await this.createEquipment.execute({
      userId,
      name: body.name,
      kind: body.kind,
      barKilograms: body.barKilograms,
      stackPositions: body.stackPositions,
    })

    return toEquipmentView(created)
  }
}
