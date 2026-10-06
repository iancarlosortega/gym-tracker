'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { ListSkeleton } from '@/components/loading-skeletons'
import { OfflineNotice } from '@/components/query-state'
import { localTimeZone } from '@/lib/local-time'
import type { DisplayUnit } from '@/lib/units'
import { useDisplayUnit } from '../../../auth/presentation/queries'
import { sessionSetsQuery } from '../../../measurement/presentation/session-sets.queries'
import { SetEditorContainer } from '../../../measurement/presentation/set-editor/set-editor.container'
import { type DoneSet, doneRowsFor } from '../../../measurement/presentation/workout/done-sets'
import type {
  EquipmentResponse,
  ExerciseResponse,
} from '../../../workouts/infrastructure/workouts.api'
import { offlineWork } from '../../../workouts/presentation/offline-work'
import { useEquipment, useExercises } from '../../../workouts/presentation/queries'
import { type ExerciseSets, WorkoutDetail } from '../components/workout-detail'
import { useDeleteWorkout, useWorkoutSummary } from '../history.queries'
import { workoutDay, workoutTimes } from '../history-grouping'

export interface WorkoutDetailContainerProps {
  readonly workoutId: string
  /** Injected for tests; the phone's zone otherwise. */
  readonly zone?: string
}

/** Exercises in the order they were first done that day, each with its sets in log order. */
const groupsOf = (
  sets: readonly DoneSet[],
  exercises: readonly ExerciseResponse[],
  equipment: readonly EquipmentResponse[],
  unit: DisplayUnit,
): ExerciseSets[] => {
  const firsts = new Map<string, DoneSet>()
  for (const set of [...sets].sort((a, b) => a.loggedAt.getTime() - b.loggedAt.getTime())) {
    if (!firsts.has(set.exerciseId)) firsts.set(set.exerciseId, set)
  }

  return [...firsts.values()].map((first) => ({
    exerciseId: first.exerciseId,
    name: exercises.find((exercise) => exercise.id === first.exerciseId)?.name ?? 'Exercise',
    equipmentName: equipment.find((item) => item.id === first.equipmentId)?.name ?? null,
    rows: doneRowsFor(first.exerciseId, sets, unit),
  }))
}

export const WorkoutDetailContainer = ({
  workoutId,
  zone = localTimeZone(),
}: WorkoutDetailContainerProps) => {
  const router = useRouter()
  const unit = useDisplayUnit()
  const work = useMemo(() => offlineWork(), [])
  const summary = useWorkoutSummary(workoutId)
  const sets = useQuery(sessionSetsQuery(workoutId, work.sets)).data ?? []
  const exercises = useExercises().data ?? []
  const equipment = useEquipment().data ?? []
  const [editingId, setEditingId] = useState<string | null>(null)
  const remove = useDeleteWorkout(work)

  if (summary.isPending) {
    return summary.fetchStatus === 'paused' ? (
      <OfflineNotice />
    ) : (
      <ListSkeleton label="Loading the workout" />
    )
  }
  if (summary.isError) {
    return <p role="alert">Could not load this workout. It may have been deleted.</p>
  }

  const workout = summary.data
  const groups = groupsOf(sets, exercises, equipment, unit)
  const editing = sets.find((set) => set.id === editingId) ?? null
  const editingRow = groups.flatMap((group) => group.rows).find((row) => row.id === editingId)
  const perHand =
    editing?.mode === 'PER_SIDE' &&
    equipment.find((item) => item.id === editing.equipmentId)?.kind === 'FREE_WEIGHT'

  return (
    <>
      <WorkoutDetail
        title={workout.routineName ?? 'Workout'}
        day={workoutDay(workout.startedAt, zone)}
        times={workoutTimes(workout.startedAt, workout.finishedAt, zone)}
        setCount={sets.length}
        open={workout.finishedAt === null}
        groups={groups}
        deleting={remove.isPending}
        deleteFailed={remove.isError}
        onEdit={setEditingId}
        onDelete={() =>
          remove.mutate(workoutId, { onSuccess: () => router.push('/statistics/history') })
        }
      />
      <SetEditorContainer
        sessionId={workoutId}
        queue={work.sets}
        set={editing}
        setNumber={editingRow?.setNumber ?? 0}
        perHand={perHand}
        onClose={() => setEditingId(null)}
      />
    </>
  )
}
