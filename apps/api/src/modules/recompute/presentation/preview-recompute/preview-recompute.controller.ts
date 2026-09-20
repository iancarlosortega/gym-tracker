import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { PreviewRecomputeUseCase } from '@api/modules/recompute/application/use-cases/preview-recompute.use-case.js'
import {
  type RecomputePreviewView,
  toRecomputePreviewView,
} from '@api/modules/recompute/presentation/recompute.view.js'
import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common'

/** A POST that writes nothing: it is a computation, not a change. */
@Controller('equipment')
export class PreviewRecomputeController {
  constructor(private readonly preview: PreviewRecomputeUseCase) {}

  @Post(':id/recompute/preview')
  @HttpCode(HttpStatus.OK)
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) equipmentId: string,
  ): Promise<RecomputePreviewView> {
    return toRecomputePreviewView(await this.preview.execute({ userId, equipmentId }))
  }
}
