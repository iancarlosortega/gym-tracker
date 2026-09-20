'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { HttpWorkoutGateway } from '../../../workouts/infrastructure/http-workout.gateway'
import { RecomputeContainer } from './recompute.container'

export interface RecomputePageContainerProps {
  readonly apiBaseUrl: string
  readonly equipmentId: string
}

/**
 * Names the equipment and the exercises before the correction is described.
 *
 * Ids would be honest and useless: "42 sets on 0199a1f0…" is not a decision
 * anyone can make. A failed lookup falls back to plain words rather than
 * blocking the correction itself.
 */
export const RecomputePageContainer = ({
  apiBaseUrl,
  equipmentId,
}: RecomputePageContainerProps) => {
  const router = useRouter()
  const gateway = useMemo(() => new HttpWorkoutGateway(apiBaseUrl), [apiBaseUrl])
  const [equipmentName, setEquipmentName] = useState('bar')
  const [exerciseNames, setExerciseNames] = useState<ReadonlyMap<string, string>>(new Map())

  useEffect(() => {
    void (async () => {
      const [equipment, exercises] = await Promise.all([
        gateway.equipment().catch(() => []),
        gateway.exercises().catch(() => []),
      ])

      setEquipmentName(equipment.find((item) => item.id === equipmentId)?.name ?? 'bar')
      setExerciseNames(new Map(exercises.map((exercise) => [exercise.id, exercise.name])))
    })()
  }, [gateway, equipmentId])

  return (
    <>
      <h1 className="font-bold text-2xl">Correct {equipmentName}</h1>
      <RecomputeContainer
        apiBaseUrl={apiBaseUrl}
        equipmentId={equipmentId}
        equipmentName={equipmentName}
        exerciseNames={exerciseNames}
        onDone={() => router.back()}
      />
    </>
  )
}
