import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { GetEquipmentUsageUseCase } from '@api/modules/catalog/application/use-cases/get-equipment-usage.use-case.js'
import type { EquipmentUsage } from '@gym/domain/catalog/repositories/equipment-usage.repository'
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'

/** No DTO: the only input is the identifier in the path. */
@Controller('equipment')
export class GetEquipmentUsageController {
  constructor(private readonly getUsage: GetEquipmentUsageUseCase) {}

  @Get(':id/usage')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EquipmentUsage> {
    return await this.getUsage.execute({ userId, equipmentId: id })
  }
}
