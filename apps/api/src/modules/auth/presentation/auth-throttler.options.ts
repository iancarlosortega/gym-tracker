import type { EnvironmentVariables } from '@api/config/environment.schema.js'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { ThrottlerModuleOptions, ThrottlerOptionsFactory } from '@nestjs/throttler'

const MILLISECONDS_PER_SECOND = 1000

/**
 * How many sign-in and sign-up attempts one client gets per window.
 *
 * Only the two public auth routes carry the guard. They are the ones anyone
 * can reach without a session, and sign-up answers "that email is taken", so
 * the limit is what keeps it from being a fast way to probe addresses.
 *
 * The client is `req.ip`, which only names the real caller when Express
 * trusts the proxy in front (`TRUST_PROXY`); otherwise every request would
 * share the proxy's address and one person could lock everyone out.
 */
@Injectable()
export class AuthThrottlerOptions implements ThrottlerOptionsFactory {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  createThrottlerOptions(): ThrottlerModuleOptions {
    return {
      throttlers: [
        {
          limit: this.config.get('AUTH_RATE_LIMIT', { infer: true }),
          ttl:
            this.config.get('AUTH_RATE_WINDOW_SECONDS', { infer: true }) * MILLISECONDS_PER_SECOND,
        },
      ],
      errorMessage: 'Too many attempts. Wait a minute and try again.',
    }
  }
}
