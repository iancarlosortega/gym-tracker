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
export const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1),
    FRONTEND_ORIGIN: z.url(),
    API_ORIGIN: z.url(),
    SESSION_LIFETIME_DAYS: z.coerce.number().int().positive().default(90),
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
