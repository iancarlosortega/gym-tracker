import { RestInterval } from '@domain/rest-timer/value-objects/rest-interval.vo.js'
import { InvalidRestDurationError } from '@domain/routines/errors.js'
import { RestDuration } from '@domain/routines/value-objects/rest-duration.vo.js'
import { describe, expect, it } from 'vitest'

const startedAt = new Date('2026-09-20T08:00:00.000Z')
const threeMinutes = RestInterval.start({ duration: RestDuration.create(180), startedAt })

const secondsLater = (seconds: number) => new Date(startedAt.getTime() + seconds * 1000)

describe('RestInterval', () => {
  it('ends its duration after it started', () => {
    expect(threeMinutes.endsAt).toEqual(secondsLater(180))
  })

  it('counts down from the instant it is asked about', () => {
    expect(threeMinutes.remainingSecondsAt(startedAt)).toBe(180)
    expect(threeMinutes.remainingSecondsAt(secondsLater(57))).toBe(123)
  })

  it('has nothing left once it is over, never a deficit', () => {
    expect(threeMinutes.remainingSecondsAt(secondsLater(400))).toBe(0)
    expect(threeMinutes.hasElapsedAt(secondsLater(400))).toBe(true)
  })

  it('is not yet elapsed on its final second', () => {
    expect(threeMinutes.hasElapsedAt(secondsLater(179))).toBe(false)
    expect(threeMinutes.hasElapsedAt(secondsLater(180))).toBe(true)
  })

  it('adjusts the duration and keeps the moment it started', () => {
    const longer = threeMinutes.adjustedBy(30)

    expect(longer.seconds).toBe(210)
    expect(longer.startedAt).toEqual(startedAt)
    expect(longer.remainingSecondsAt(secondsLater(60))).toBe(150)
  })

  it('shortens as well as lengthens', () => {
    expect(threeMinutes.adjustedBy(-30).seconds).toBe(150)
  })

  it('refuses an adjustment that would leave no rest at all', () => {
    expect(() => threeMinutes.adjustedBy(-180)).toThrow(InvalidRestDurationError)
  })

  it('refuses an adjustment beyond an hour', () => {
    expect(() => threeMinutes.adjustedBy(3600)).toThrow(InvalidRestDurationError)
  })

  it('does not change when a caller mutates the date it was given', () => {
    const mutable = new Date(startedAt)
    const interval = RestInterval.start({ duration: RestDuration.default(), startedAt: mutable })

    mutable.setFullYear(1999)

    expect(interval.startedAt).toEqual(startedAt)
  })
})
