import { DomainExceptionFilter } from '@api/common/filters/domain-exception.filter.js'
import type { RequestWithCaller } from '@api/common/http/decorators/caller.decorator.js'
import { FinishWorkoutUseCase } from '@api/modules/workouts/application/use-cases/finish-workout.use-case.js'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import type { ExecutionContext } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FinishWorkoutController } from './finish-workout.controller.ts'

const sessionId = '0199a1f0-0000-7000-8000-00000000f001'
const userId = '0199a1f0-0000-7000-8000-00000000a001'

let app: NestExpressApplication
let received: { finishedAt?: Date | undefined } | undefined

beforeEach(async () => {
  received = undefined
  const session = WorkoutSession.start({
    userId: Id.create(),
    startedAt: new Date('2026-10-04T09:00:00.000Z'),
  })

  const moduleRef = await Test.createTestingModule({
    controllers: [FinishWorkoutController],
    providers: [
      {
        provide: FinishWorkoutUseCase,
        useValue: {
          execute: async (input: { finishedAt?: Date | undefined }) => {
            received = input
            return session.finishedAt(input.finishedAt ?? new Date('2026-10-04T10:00:00.000Z'))
          },
        },
      },
      {
        // Stands in for the session guard: it lets the request through with a caller.
        provide: APP_GUARD,
        useValue: {
          canActivate: (context: ExecutionContext) => {
            context.switchToHttp().getRequest<RequestWithCaller>().caller = {
              user: { id: { value: userId } },
            } as RequestWithCaller['caller']
            return true
          },
        },
      },
    ],
  }).compile()

  app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false })
  app.useGlobalFilters(new DomainExceptionFilter())
  await app.init()
})

afterEach(async () => {
  await app.close()
})

describe('finishing a workout over http', () => {
  it('asks for the server clock when the request has no body', async () => {
    await request(app.getHttpServer()).post(`/workouts/${sessionId}/finish`).expect(201)

    expect(received?.finishedAt).toBeUndefined()
  })

  it('passes on the instant the user pressed finish', async () => {
    const response = await request(app.getHttpServer())
      .post(`/workouts/${sessionId}/finish`)
      .send({ finishedAt: '2026-10-04T09:45:00.000Z' })
      .expect(201)

    expect(received?.finishedAt).toEqual(new Date('2026-10-04T09:45:00.000Z'))
    expect(response.body.finishedAt).toBe('2026-10-04T09:45:00.000Z')
  })
})
