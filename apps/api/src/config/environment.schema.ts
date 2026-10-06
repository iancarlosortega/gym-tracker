import { shareRegistrableDomain } from '@api/config/same-site-origins.js'
import { z } from 'zod'

/**
 * The environment this service requires, validated once at bootstrap.
 *
 * Nest validates this while the application is being created, so a missing or
 * contradictory variable stops the process before it ever listens. That matters
 * most for the origin pair: an application that starts cleanly and cannot keep
 * anyone signed in is a far worse failure than one that refuses to start.
 */
/**
 * Absent and empty mean the same thing here.
 *
 * Compose substitutes an unset variable as an empty string rather than
 * leaving it out, so `.optional()` alone would refuse to start a deployment
 * that simply has no push keys — exactly the case these are optional for.
 */
const optionalSetting = <TSchema extends z.ZodType>(schema: TSchema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

export const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1),
    FRONTEND_ORIGIN: z.url(),
    API_ORIGIN: z.url(),
    SESSION_LIFETIME_DAYS: z.coerce.number().int().positive().default(90),
    /** Sign-in and sign-up attempts one client gets per window. */
    AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(5),
    AUTH_RATE_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
    /**
     * How many reverse proxies stand in front of the API. The rate limit keys
     * on the client address, which Express only reads from X-Forwarded-For
     * when it trusts that many hops; 0 trusts none, which is right only when
     * clients connect directly.
     */
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    /**
     * VAPID identifies this application to Apple's and Google's push
     * services; without the pair they refuse the request outright.
     *
     * Optional, because pocketed alerts are an enhancement and the
     * foreground rest timer is the guaranteed path. A deployment without
     * these keys runs, logs that alerts are off, and delivers nothing.
     */
    VAPID_PUBLIC_KEY: optionalSetting(z.string().min(1)),
    VAPID_PRIVATE_KEY: optionalSetting(z.string().min(1)),
    /** A mailto: or https: contact the push service can reach. */
    VAPID_SUBJECT: optionalSetting(
      z.union([z.email().transform((address) => `mailto:${address}`), z.url()]),
    ),
  })
  .superRefine((environment, context) => {
    if (!shareRegistrableDomain(environment.FRONTEND_ORIGIN, environment.API_ORIGIN)) {
      context.addIssue({
        code: 'custom',
        path: ['FRONTEND_ORIGIN'],
        message: [
          'The frontend and API origins do not share a registrable domain, so the session',
          'cookie would be treated as third-party and authentication would fail.',
          `  frontend: ${environment.FRONTEND_ORIGIN}`,
          `  api:      ${environment.API_ORIGIN}`,
          'Serve both from one domain you control, for example gym.example.com and api.gym.example.com.',
        ].join('\n'),
      })
    }
  })

export type EnvironmentVariables = z.infer<typeof environmentSchema>
