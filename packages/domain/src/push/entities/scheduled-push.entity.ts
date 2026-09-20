import { PushScheduledInThePastError } from '@domain/push/errors.js'
import { Id } from '@domain/shared/value-objects/id.vo.js'

export interface SchedulePushInput {
  readonly userId: Id
  /** The set whose rest this alert ends; also what cancelling names. */
  readonly setId: Id
  readonly fireAt: Date
  readonly now: Date
}

export interface ScheduledPushProps {
  readonly id: Id
  readonly userId: Id
  readonly setId: Id
  readonly fireAt: Date
  readonly sentOn: Date | null
}

/**
 * A rest-end alert waiting for its moment.
 *
 * It exists as a row rather than a timer in memory because a deploy or a
 * crash during a three-minute rest would drop a setTimeout silently, and the
 * user would be standing in the gym trusting a buzz that is never coming. A
 * row that is picked up late is a worse alert; a timer that vanished is no
 * alert at all.
 */
export class ScheduledPush {
  private constructor(private readonly props: ScheduledPushProps) {
    Object.freeze(this)
  }

  static schedule(input: SchedulePushInput): ScheduledPush {
    if (input.fireAt.getTime() <= input.now.getTime()) {
      throw new PushScheduledInThePastError('A rest alert cannot be scheduled for the past.')
    }

    return new ScheduledPush({
      id: Id.createAt(input.now),
      userId: input.userId,
      setId: input.setId,
      fireAt: new Date(input.fireAt),
      sentOn: null,
    })
  }

  static restore(props: ScheduledPushProps): ScheduledPush {
    return new ScheduledPush({
      ...props,
      fireAt: new Date(props.fireAt),
      sentOn: props.sentOn === null ? null : new Date(props.sentOn),
    })
  }

  get id(): Id {
    return this.props.id
  }

  get userId(): Id {
    return this.props.userId
  }

  get setId(): Id {
    return this.props.setId
  }

  get fireAt(): Date {
    return new Date(this.props.fireAt)
  }

  get isSent(): boolean {
    return this.props.sentOn !== null
  }

  get sentOn(): Date | null {
    return this.props.sentOn === null ? null : new Date(this.props.sentOn)
  }

  isDueAt(instant: Date): boolean {
    return !this.isSent && this.props.fireAt.getTime() <= instant.getTime()
  }

  /** Marking it sent is what stops a second tick sending it again. */
  sentAt(instant: Date): ScheduledPush {
    return new ScheduledPush({ ...this.props, sentOn: new Date(instant) })
  }
}
