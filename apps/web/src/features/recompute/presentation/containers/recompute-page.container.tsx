'use client'

import { useRouter } from 'next/navigation'
import { useEquipment, useExercises } from '../../../workouts/presentation/queries'
import { RecomputeContainer } from './recompute.container'

export interface RecomputePageContainerProps {
  readonly equipmentId: string
}

/**
 * Names the equipment and the exercises before the correction is described.
 *
 * Ids would be honest and useless: "42 sets on 0199a1f0…" is not a decision
 * anyone can make. A failed lookup falls back to plain words rather than
 * blocking the correction itself.
 */
export const RecomputePageContainer = ({ equipmentId }: RecomputePageContainerProps) => {
  const router = useRouter()
  const equipmentName = useEquipment().data?.find((item) => item.id === equipmentId)?.name ?? 'bar'
  const exercises = useExercises().data
  const exerciseNames = new Map(exercises?.map((exercise) => [exercise.id, exercise.name]))

  return (
    <>
      <h1 className="font-bold text-2xl">Correct {equipmentName}</h1>
      <RecomputeContainer
        equipmentId={equipmentId}
        equipmentName={equipmentName}
        exerciseNames={exerciseNames}
        onDone={() => router.back()}
      />
    </>
  )
}
