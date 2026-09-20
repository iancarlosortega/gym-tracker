import { DispatchDuePushesUseCase } from '@api/modules/push/application/use-cases/dispatch-due-pushes.use-case.js'
import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common'

const TICK_MILLISECONDS = 1000

/**
 * Looks for due rest alerts once a second.
 *
 * A second of latency on a three-minute rest is not worth a job queue: Redis
 * would be another resident process on a shared four-gigabyte box, to
 * schedule roughly twenty rows a day. Polling is boring and costs nothing.
 *
 * Ticks never overlap. A dispatch that runs long — a slow push service — must
 * not have a second one start behind it, so the next tick is scheduled after
 * the previous finishes rather than on a fixed interval.
 */
@Injectable()
export class PushDispatchTick implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(PushDispatchTick.name)
  private timer: NodeJS.Timeout | null = null
  private stopped = false

  constructor(private readonly dispatch: DispatchDuePushesUseCase) {}

  onApplicationBootstrap(): void {
    this.scheduleNext()
  }

  onModuleDestroy(): void {
    this.stopped = true

    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  private scheduleNext(): void {
    if (this.stopped) {
      return
    }

    this.timer = setTimeout(() => {
      void this.runOnce()
    }, TICK_MILLISECONDS)

    // Never hold the process open for the next tick.
    this.timer.unref?.()
  }

  private async runOnce(): Promise<void> {
    try {
      const result = await this.dispatch.execute()

      if (result.sent > 0) {
        this.logger.log(`Sent ${result.sent} rest alert(s), invalidated ${result.invalidated}.`)
      }
    } catch (failure) {
      // A failed tick must not stop the ticking; the next one tries again.
      this.logger.error('A push dispatch tick failed.', failure)
    } finally {
      this.scheduleNext()
    }
  }
}
