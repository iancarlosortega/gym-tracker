/**
 * When each routine was last followed, read from the user's workouts.
 *
 * A routine never followed is simply absent from the map.
 */
export interface RoutineHistoryRepository {
  lastDoneAt(userId: string): Promise<ReadonlyMap<string, Date>>
}
