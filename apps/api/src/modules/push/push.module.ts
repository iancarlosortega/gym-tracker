import { SystemClock } from '@api/modules/auth/infrastructure/adapters/system-clock.adapter.js'
import { CancelRestPushUseCase } from '@api/modules/push/application/use-cases/cancel-rest-push.use-case.js'
import { DispatchDuePushesUseCase } from '@api/modules/push/application/use-cases/dispatch-due-pushes.use-case.js'
import { ScheduleRestPushUseCase } from '@api/modules/push/application/use-cases/schedule-rest-push.use-case.js'
import { WebPushSender } from '@api/modules/push/infrastructure/adapters/web-push-sender.adapter.js'
import { DrizzlePushScheduler } from '@api/modules/push/infrastructure/persistence/drizzle-push.scheduler.js'
import { DrizzlePushSubscriptionRepository } from '@api/modules/push/infrastructure/persistence/drizzle-push-subscription.repository.js'
import { PushDispatchTick } from '@api/modules/push/infrastructure/push-dispatch.tick.js'
import { CancelRestPushController } from '@api/modules/push/presentation/cancel-rest-push/cancel-rest-push.controller.js'
import { ScheduleRestPushController } from '@api/modules/push/presentation/schedule-rest-push/schedule-rest-push.controller.js'
import {
  CLOCK,
  PUSH_SCHEDULER,
  PUSH_SENDER,
  PUSH_SUBSCRIPTION_REPOSITORY,
} from '@api/modules/push/push.tokens.js'
import { Module } from '@nestjs/common'

/**
 * Composition root for rest alerts.
 *
 * The tick lives here rather than in main.ts so it starts and stops with the
 * module that owns it, and so a test can build the module without one.
 */
@Module({
  controllers: [ScheduleRestPushController, CancelRestPushController],
  providers: [
    { provide: CLOCK, useClass: SystemClock },
    { provide: PUSH_SCHEDULER, useClass: DrizzlePushScheduler },
    { provide: PUSH_SENDER, useClass: WebPushSender },
    { provide: PUSH_SUBSCRIPTION_REPOSITORY, useClass: DrizzlePushSubscriptionRepository },
    ScheduleRestPushUseCase,
    CancelRestPushUseCase,
    DispatchDuePushesUseCase,
    PushDispatchTick,
  ],
  exports: [PUSH_SUBSCRIPTION_REPOSITORY],
})
export class PushModule {}
