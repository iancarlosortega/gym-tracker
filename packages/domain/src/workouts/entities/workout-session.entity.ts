import { Id } from '@domain/shared/value-objects/id.vo.js'
import { InvalidWorkoutTimesError, WorkoutAlreadyFinishedError } from '@domain/workouts/errors.js'

export interface StartWorkoutSessionInput {
  readonly userId: Id
  /** The plan being followed, or null for an ad hoc workout. */
  readonly routineId?: Id | null
  readonly startedAt: Date
}

export interface WorkoutSessionProps {
  readonly id: Id
  readonly userId: Id
  readonly routineId: Id | null
  readonly startedAt: Date
  readonly finishedOn: Date | null
}

/**
 * One visit to the gym: the thing sets are logged against.
 *
 * A session holds no sets. They are their own aggregate, written one at a
 * time from a phone that may be offline, and loading a session would
 * otherwise mean loading every set in it before the first one could be
 * recorded.
 *
 * The routine is a reference, not a copy. Editing a plan afterwards never
 * rewrites the workout that was done, because nothing of the plan was
 * carried into the session.
 *
 * Both instants are passed in rather than read from the clock: when a
 * session started and whether it is still open is behaviour, and a test that
 * cannot choose the instant cannot assert on it.
 */
export class WorkoutSession {
  private constructor(private readonly props: WorkoutSessionProps) {
    Object.freeze(this)
  }

  static start(input: StartWorkoutSessionInput): WorkoutSession {
    const startedAt = new Date(input.startedAt)

    return new WorkoutSession({
      id: Id.createAt(startedAt),
      userId: input.userId,
      routineId: input.routineId ?? null,
      startedAt,
      finishedOn: null,
    })
  }

  static restore(props: WorkoutSessionProps): WorkoutSession {
    return new WorkoutSession({
      ...props,
      startedAt: new Date(props.startedAt),
      finishedOn: props.finishedOn === null ? null : new Date(props.finishedOn),
    })
  }

  get id(): Id {
    return this.props.id
  }

  get userId(): Id {
    return this.props.userId
  }

  get routineId(): Id | null {
    return this.props.routineId
  }

  get startedAt(): Date {
    return new Date(this.props.startedAt)
  }

  get finishedOn(): Date | null {
    return this.props.finishedOn === null ? null : new Date(this.props.finishedOn)
  }

  get isFinished(): boolean {
    return this.props.finishedOn !== null
  }

  /** An open session is what "resume" resumes. */
  get isOpen(): boolean {
    return this.props.finishedOn === null
  }

  /**
   * Finishing is one-way.
   *
   * Reopening would let a later set land in a workout that was already
   * summarised, so a session finished by mistake is refused here rather than
   * silently rewritten.
   */
  finishedAt(instant: Date): WorkoutSession {
    if (this.isFinished) {
      throw new WorkoutAlreadyFinishedError('That workout has already been finished.')
    }

    const finishedOn = new Date(instant)
    if (finishedOn.getTime() < this.props.startedAt.getTime()) {
      throw new InvalidWorkoutTimesError('A workout cannot finish before it started.')
    }

    return new WorkoutSession({ ...this.props, finishedOn })
  }

  equals(other: WorkoutSession): boolean {
    return this.props.id.equals(other.id)
  }
}
