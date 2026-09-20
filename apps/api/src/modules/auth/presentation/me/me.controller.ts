import type { RequestWithCaller } from '@api/modules/auth/presentation/session.guard.js'
import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common'
import { type CallerView, toCallerView } from './me.view.js'

@Controller('auth')
export class MeController {
  @Get('me')
  handle(@Req() request: RequestWithCaller): CallerView {
    const user = request.caller?.user
    if (user === undefined) {
      throw new UnauthorizedException()
    }

    return toCallerView(user)
  }
}
