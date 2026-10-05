import { GetCaller } from '@api/common/http/decorators/caller.decorator.js'
import { ChangeDisplayUnitUseCase } from '@api/modules/auth/application/use-cases/change-display-unit.use-case.js'
import type { AuthenticatedCaller } from '@api/modules/auth/application/use-cases/validate-session.use-case.js'
import type { User } from '@gym/domain/auth/entities/user.entity'
import { Body, Controller, Get, Patch, UnauthorizedException } from '@nestjs/common'
import { ChangeDisplayUnitDto } from './change-display-unit.dto.js'
import { type CallerView, toCallerView } from './me.view.js'

@Controller('auth')
export class MeController {
  constructor(private readonly changeDisplayUnit: ChangeDisplayUnitUseCase) {}

  @Get('me')
  handle(@GetCaller() caller: AuthenticatedCaller | undefined): CallerView {
    const user: User | undefined = caller?.user
    if (user === undefined) {
      throw new UnauthorizedException()
    }

    return toCallerView(user)
  }

  @Patch('me')
  async change(
    @GetCaller() caller: AuthenticatedCaller | undefined,
    @Body() body: ChangeDisplayUnitDto,
  ): Promise<CallerView> {
    if (caller === undefined) {
      throw new UnauthorizedException()
    }

    return toCallerView(
      await this.changeDisplayUnit.execute({
        userId: caller.user.id.value,
        displayUnit: body.displayUnit,
      }),
    )
  }
}
