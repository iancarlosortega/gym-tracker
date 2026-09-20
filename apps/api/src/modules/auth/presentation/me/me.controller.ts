import { GetCaller } from '@api/common/http/decorators/caller.decorator.js'
import type { AuthenticatedCaller } from '@api/modules/auth/application/use-cases/validate-session.use-case.js'
import type { User } from '@gym/domain/auth/entities/user.entity'
import { Controller, Get, UnauthorizedException } from '@nestjs/common'
import { type CallerView, toCallerView } from './me.view.js'

@Controller('auth')
export class MeController {
  @Get('me')
  handle(@GetCaller() caller: AuthenticatedCaller | undefined): CallerView {
    const user: User | undefined = caller?.user
    if (user === undefined) {
      throw new UnauthorizedException()
    }

    return toCallerView(user)
  }
}
