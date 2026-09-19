import { CrossExerciseComparisonError } from '../errors.ts'
import type { StackPosition } from '../value-objects/stack-position.vo.ts'

export interface StackPositionSample {
  readonly exerciseId: string
  readonly position: StackPosition
}

/**
 * Order two stack positions belonging to the same exercise.
 *
 * Comparing positions across exercises is refused rather than computed: the
 * two stacks are unrelated, so any ordering between them would be meaningless.
 */
export function compareStackPositions(
  left: StackPositionSample,
  right: StackPositionSample,
): number {
  if (left.exerciseId !== right.exerciseId) {
    throw new CrossExerciseComparisonError(
      'Stack positions from different exercises are not comparable: each stack is its own scale.',
    )
  }
  return left.position - right.position
}
