import { DomainExceptionFilter } from '@api/common/filters/domain-exception.filter.js'
import type { RequestWithCaller } from '@api/common/http/decorators/caller.decorator.js'
import {
  type DeleteWorkoutInput,
  DeleteWorkoutUseCase,
} from '@api/modules/measurement/application/use-cases/delete-workout.use-case.js'
import { WorkoutSessionNotFoundError } from '@gym/domain/workouts/errors'
import type { ExecutionContext } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DeleteWorkoutController } from './delete-workout.controller.ts'

const userId = '0199a1f0-0000-7000-8000-00000000a001'
const workoutId = '0199a1f0-0000-7000-8000-00000000f001'
const missingId = '0199a1f0-0000-7000-8000-00000000ffff'

let app: NestExpressApplication
let deleted: DeleteWorkoutInput[]

beforeEach(async () => {
  deleted = []

  const moduleRef = await Test.createTestingModule({
    controllers: [DeleteWorkoutController],
    providers: [
      {
        provide: DeleteWorkoutUseCase,
        useValue: {
          execute: async (input: DeleteWorkoutInput) => {
            if (input.sessionId === missingId) {
              throw new WorkoutSessionNotFoundError('That workout does not exist.')
            }
            deleted.push(input)
          },
        },
      },
      {
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

describe('deleting a workout over http', () => {
  it('answers 204 once the workout is gone', async () => {
    await request(app.getHttpServer()).delete(`/workouts/${workoutId}`).expect(204)

    expect(deleted).toEqual([{ userId, sessionId: workoutId }])
  })

  it('answers 404 for a workout that is not the caller’s', async () => {
    await request(app.getHttpServer()).delete(`/workouts/${missingId}`).expect(404)
  })
})
