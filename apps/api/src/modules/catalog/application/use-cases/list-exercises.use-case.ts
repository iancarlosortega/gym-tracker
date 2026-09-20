import { EXERCISE_REPOSITORY } from '@api/modules/catalog/catalog.tokens.js'
import type { Exercise } from '@gym/domain/catalog/entities/exercise.entity'
import type {
  ExerciseCriteriaFields,
  ExerciseRepository,
  ExerciseSortField,
} from '@gym/domain/catalog/repositories/exercise.repository'
import { Criteria } from '@gym/domain/shared/value-objects/criteria.vo'
import type { Page } from '@gym/domain/shared/value-objects/page.vo'
import { Pagination } from '@gym/domain/shared/value-objects/pagination.vo'
import { QueryOptions } from '@gym/domain/shared/value-objects/query-options.vo'

export interface ListExercisesInput {
  readonly userId: string
  /** Defaults to active only, which is what routine building needs. */
  readonly includeArchived?: boolean | undefined
  readonly limit?: number | undefined
  readonly offset?: number | undefined
}

@Injectable()
export class ListExercisesUseCase {
  constructor(@Inject(EXERCISE_REPOSITORY) private readonly exercises: ExerciseRepository) {}

  async execute(input: ListExercisesInput): Promise<Page<Exercise>> {
    const criteria =
      input.includeArchived === true
        ? Criteria.create<ExerciseCriteriaFields>({ userId: input.userId })
        : Criteria.create<ExerciseCriteriaFields>({ userId: input.userId, archived: false })

    return await this.exercises.findMany(
      criteria,
      Pagination.create({ limit: input.limit, offset: input.offset }),
      QueryOptions.none<ExerciseSortField>().orderedBy('name'),
    )
  }
}

import { Inject, Injectable } from '@nestjs/common'
