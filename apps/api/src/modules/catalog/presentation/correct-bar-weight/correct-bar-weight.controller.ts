import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { CorrectBarWeightUseCase } from '@api/modules/catalog/application/use-cases/correct-bar-weight.use-case.js'
import {
  type EquipmentView,
  toEquipmentView,
} from '@api/modules/catalog/presentation/equipment.view.js'
import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common'
import { CorrectBarWeightDto } from './correct-bar-weight.dto.js'

/**
 * A correction applies to sets logged from now on. Past sets keep the bar
 * weight snapshotted on them; bringing them in line is the separate,
 * previewed recompute.
 */
@Controller('equipment')
export class CorrectBarWeightController {
  constructor(private readonly correctBarWeight: CorrectBarWeightUseCase) {}

  @Put(':id/bar-weight')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CorrectBarWeightDto,
  ): Promise<EquipmentView> {
    const corrected = await this.correctBarWeight.execute({
      userId,
      equipmentId: id,
      barKilograms: body.barKilograms,
    })

    return toEquipmentView(corrected)
  }
}
