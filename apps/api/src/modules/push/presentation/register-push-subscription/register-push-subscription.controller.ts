import { GetUserId } from '@api/common/http/decorators/caller.decorator.js'
import { RegisterPushSubscriptionUseCase } from '@api/modules/push/application/use-cases/register-push-subscription.use-case.js'
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { RegisterPushSubscriptionDto } from './register-push-subscription.dto.js'

@Controller('push-subscriptions')
export class RegisterPushSubscriptionController {
  constructor(private readonly register: RegisterPushSubscriptionUseCase) {}

  /** Nothing is returned: the keys came from the caller and belong to it. */
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async handle(
    @GetUserId() userId: string,
    @Body() body: RegisterPushSubscriptionDto,
  ): Promise<void> {
    await this.register.execute({
      userId,
      endpoint: body.endpoint,
      p256dh: body.p256dh,
      auth: body.auth,
    })
  }
}
