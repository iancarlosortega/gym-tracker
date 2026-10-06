import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { CorrectSetUseCase } from '@api/modules/measurement/application/use-cases/correct-set.use-case.js'
import {
  type LoggedSetView,
  toLoggedSetView,
} from '@api/modules/measurement/presentation/logged-set.view.js'
import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { CorrectSetDto } from './correct-set.dto.js'

/**
 * Sets are addressed by their own id: it is unique, and the workout it
 * belongs to is the server's to check, not the client's to repeat.
 */
@Controller('sets')
export class CorrectSetController {
  constructor(private readonly correctSet: CorrectSetUseCase) {}

  @Patch(':id')
  async handle(
    @GetUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CorrectSetDto,
  ): Promise<LoggedSetView> {
    const corrected = await this.correctSet.execute({ userId, setId: id, ...body })

    return toLoggedSetView(corrected)
  }
}
