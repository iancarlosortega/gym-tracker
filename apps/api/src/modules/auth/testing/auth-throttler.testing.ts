import { AuthThrottlerOptions } from '@api/modules/auth/presentation/auth-throttler.options.js'
import type { DynamicModule } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'

class StubConfigModule {}

/**
 * The auth throttler as the app builds it, reading a stubbed config.
 *
 * `ThrottlerModule.forRootAsync` resolves its options class inside its own
 * module, so the stub has to arrive as an import rather than a sibling
 * provider of the controller under test.
 */
export const authThrottlerForTests = (settings: ReadonlyMap<string, unknown>): DynamicModule =>
  ThrottlerModule.forRootAsync({
    imports: [
      {
        module: StubConfigModule,
        providers: [
          { provide: ConfigService, useValue: { get: (key: string) => settings.get(key) } },
        ],
        exports: [ConfigService],
      },
    ],
    useClass: AuthThrottlerOptions,
  })
