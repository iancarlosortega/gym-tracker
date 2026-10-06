import { DomainExceptionFilter } from '@api/common/filters/domain-exception.filter.js'
import type { RequestWithCaller } from '@api/common/http/decorators/caller.decorator.js'
import { GetWorkoutUseCase } from '@api/modules/workouts/application/use-cases/get-workout.use-case.js'
import { ResumeWorkoutUseCase } from '@api/modules/workouts/application/use-cases/resume-workout.use-case.js'
import { Id } from '@gym/domain/shared/value-objects/id.vo'
import { WorkoutSession } from '@gym/domain/workouts/entities/workout-session.entity'
import type { ExecutionContext } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ResumeWorkoutController } from '../resume-workout/resume-workout.controller.ts'
import { GetWorkoutController } from './get-workout.controller.ts'

const userId = '0199a1f0-0000-7000-8000-00000000a001'
const workoutId = '0199a1f0-0000-7000-8000-00000000f001'

let app: NestExpressApplication

beforeEach(async () => {
  const open = WorkoutSession.start({
    userId: Id.create(),
    startedAt: new Date('2026-10-05T23:05:00Z'),
  })

  const moduleRef = await Test.createTestingModule({
    // The same order as WorkoutsModule: "current" must be matched before ":id".
    controllers: [ResumeWorkoutController, GetWorkoutController],
    providers: [
      { provide: ResumeWorkoutUseCase, useValue: { execute: async () => open } },
      {
        provide: GetWorkoutUseCase,
        useValue: {
          execute: async () => ({
            id: workoutId,
            routineId: null,
            routineName: 'Push day',
            startedAt: new Date('2026-10-01T18:10:00.000Z'),
            finishedAt: new Date('2026-10-01T19:05:00.000Z'),
            setCount: 14,
          }),
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

describe('reading one workout over http', () => {
  it('answers the workout with ISO instants', async () => {
    const response = await request(app.getHttpServer()).get(`/workouts/${workoutId}`).expect(200)

    expect(response.body).toEqual({
      id: workoutId,
      routineId: null,
      routineName: 'Push day',
      startedAt: '2026-10-01T18:10:00.000Z',
      finishedAt: '2026-10-01T19:05:00.000Z',
      setCount: 14,
    })
  })

  it('still answers the open workout at /workouts/current', async () => {
    const response = await request(app.getHttpServer()).get('/workouts/current').expect(200)

    expect(response.body.open).toBe(true)
  })
})
