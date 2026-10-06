import { DomainExceptionFilter } from '@api/common/filters/domain-exception.filter.js'
import type { RequestWithCaller } from '@api/common/http/decorators/caller.decorator.js'
import {
  type CorrectSetInput,
  CorrectSetUseCase,
} from '@api/modules/measurement/application/use-cases/correct-set.use-case.js'
import { DeleteSetUseCase } from '@api/modules/measurement/application/use-cases/delete-set.use-case.js'
import { LoggedSet } from '@gym/domain/measurement/entities/logged-set.entity'
import { SetNotFoundError } from '@gym/domain/measurement/errors'
import { fromKilograms } from '@gym/domain/measurement/value-objects/grams.vo'
import { LoadEntry } from '@gym/domain/measurement/value-objects/load-entry.vo'
import { reps } from '@gym/domain/measurement/value-objects/reps.vo'
import { type ExecutionContext, ValidationPipe } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DeleteSetController } from '../delete-set/delete-set.controller.ts'
import { CorrectSetController } from './correct-set.controller.ts'

const setId = '0199a1f0-0000-7000-8000-00000000b001'
const missingId = '0199a1f0-0000-7000-8000-00000000bfff'
const userId = '0199a1f0-0000-7000-8000-00000000a001'

const corrected = LoggedSet.restore({
  id: setId,
  sessionId: '0199a1f0-0000-7000-8000-00000000f001',
  exerciseId: '0199a1f0-0000-7000-8000-00000000e001',
  equipmentId: '0199a1f0-0000-7000-8000-00000000c001',
  entry: LoadEntry.perSide(fromKilograms(25), fromKilograms(20)),
  reps: reps(10),
  loggedAt: new Date('2026-10-05T18:10:00.000Z'),
  snapshot: {
    barGrams: fromKilograms(20),
    displayUnit: 'KG',
    equipmentId: '0199a1f0-0000-7000-8000-00000000c001',
  },
  revision: 1,
})

let app: NestExpressApplication
let correctedWith: CorrectSetInput | undefined
let deleted: string[]

beforeEach(async () => {
  correctedWith = undefined
  deleted = []

  const moduleRef = await Test.createTestingModule({
    controllers: [CorrectSetController, DeleteSetController],
    providers: [
      {
        provide: CorrectSetUseCase,
        useValue: {
          execute: async (input: CorrectSetInput) => {
            if (input.setId === missingId) throw new SetNotFoundError('That set does not exist.')
            correctedWith = input
            return corrected
          },
        },
      },
      {
        provide: DeleteSetUseCase,
        useValue: {
          execute: async (input: { setId: string }) => {
            if (input.setId === missingId) throw new SetNotFoundError('That set does not exist.')
            deleted.push(input.setId)
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

describe('correcting a set over http', () => {
  it('passes the caller, the set and the new values, and answers with the set', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/sets/${setId}`)
      .send({ grams: 25_000, reps: 10 })
      .expect(200)

    expect(correctedWith).toEqual({ userId, setId, grams: 25_000, reps: 10 })
    expect(response.body).toMatchObject({
      id: setId,
      reps: 10,
      resolvedGrams: 70_000,
      rawGrams: 25_000,
      revision: 1,
    })
  })

  it('takes a position for a stack set', async () => {
    await request(app.getHttpServer())
      .patch(`/sets/${setId}`)
      .send({ position: 8, reps: 10 })
      .expect(200)

    expect(correctedWith).toEqual({ userId, setId, position: 8, reps: 10 })
  })

  it('refuses a body with both grams and a position', async () => {
    await request(app.getHttpServer())
      .patch(`/sets/${setId}`)
      .send({ grams: 25_000, position: 8, reps: 10 })
      .expect(400)

    expect(correctedWith).toBeUndefined()
  })

  it('refuses a body with no load', async () => {
    await request(app.getHttpServer()).patch(`/sets/${setId}`).send({ reps: 10 }).expect(400)
  })

  it('refuses zero reps', async () => {
    await request(app.getHttpServer())
      .patch(`/sets/${setId}`)
      .send({ grams: 25_000, reps: 0 })
      .expect(400)
  })

  it('answers 404 for a set that is not there', async () => {
    await request(app.getHttpServer())
      .patch(`/sets/${missingId}`)
      .send({ grams: 25_000, reps: 10 })
      .expect(404)
  })
})

describe('deleting a set over http', () => {
  it('answers 204 once the set is gone', async () => {
    await request(app.getHttpServer()).delete(`/sets/${setId}`).expect(204)

    expect(deleted).toEqual([setId])
  })

  it('answers 404 for a set that is not there', async () => {
    await request(app.getHttpServer()).delete(`/sets/${missingId}`).expect(404)
  })

  it('refuses an id that is not a uuid', async () => {
    await request(app.getHttpServer()).delete('/sets/not-a-uuid').expect(400)
  })
})
