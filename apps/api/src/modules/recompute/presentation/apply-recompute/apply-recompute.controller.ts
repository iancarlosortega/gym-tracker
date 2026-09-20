import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { ApplyRecomputeUseCase } from '@api/modules/recompute/application/use-cases/apply-recompute.use-case.js'
import {
  type RecomputePreviewView,
  toRecomputePreviewView,
} from '@api/modules/recompute/presentation/recompute.view.js'
import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { ApplyRecomputeDto } from './apply-recompute.dto.js'

@Controller('equipment')
export class ApplyRecomputeController {
  constructor(private readonly apply: ApplyRecomputeUseCase) {}

  @Post(':id/recompute/apply')
  @HttpCode(HttpStatus.OK)
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) equipmentId: string,
    @Body() body: ApplyRecomputeDto,
  ): Promise<RecomputePreviewView> {
    return toRecomputePreviewView(
      await this.apply.execute({ userId, equipmentId, previewToken: body.previewToken }),
    )
  }
}
