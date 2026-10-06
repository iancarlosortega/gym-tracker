import { DomainExceptionFilter } from '@api/common/filters/domain-exception.filter.js'
import type { RequestWithCaller } from '@api/common/http/decorators/caller.decorator.js'
import {
  type ListWorkoutsInput,
  ListWorkoutsUseCase,
} from '@api/modules/workouts/application/use-cases/list-workouts.use-case.js'
import { type ExecutionContext, ValidationPipe } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ListWorkoutsController } from './list-workouts.controller.ts'

const userId = '0199a1f0-0000-7000-8000-00000000a001'
const workoutId = '0199a1f0-0000-7000-8000-00000000f001'

let app: NestExpressApplication
let received: ListWorkoutsInput | undefined

beforeEach(async () => {
  received = undefined

  const moduleRef = await Test.createTestingModule({
    controllers: [ListWorkoutsController],
    providers: [
      {
        provide: ListWorkoutsUseCase,
        useValue: {
          execute: async (input: ListWorkoutsInput) => {
            received = input
            return {
              items: [
                {
                  id: workoutId,
                  routineId: null,
                  routineName: null,
                  startedAt: new Date('2026-10-01T18:10:00.000Z'),
                  finishedAt: null,
                  setCount: 3,
                },
              ],
              nextOffset: 20,
            }
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
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  )
  app.useGlobalFilters(new DomainExceptionFilter())
  await app.init()
})

afterEach(async () => {
  await app.close()
})

describe('listing workouts over http', () => {
  it('answers the page with ISO instants and where the next one starts', async () => {
    const response = await request(app.getHttpServer())
      .get('/workouts?limit=20&offset=0')
      .expect(200)

    expect(received).toEqual({ userId, limit: 20, offset: 0 })
    expect(response.body).toEqual({
      items: [
        {
          id: workoutId,
          routineId: null,
          routineName: null,
          startedAt: '2026-10-01T18:10:00.000Z',
          finishedAt: null,
          setCount: 3,
        },
      ],
      nextOffset: 20,
    })
  })

  it('reads the first page when no window is given', async () => {
    await request(app.getHttpServer()).get('/workouts').expect(200)

    expect(received).toEqual({ userId })
  })

  it('refuses a negative offset', async () => {
    await request(app.getHttpServer()).get('/workouts?offset=-1').expect(400)
  })
})
