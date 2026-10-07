import { describe, expect, it } from 'vitest'
import { lastDoneLabel } from './last-done.ts'

const now = new Date('2026-10-04T10:00:00Z') // a Sunday

describe('lastDoneLabel', () => {
  it.each([
    [null, 'Never done'],
    ['2026-10-04T08:00:00Z', 'Last done today'],
    ['2026-10-03T08:00:00Z', 'Last done yesterday'],
    ['2026-09-28T08:00:00Z', 'Last done Monday'],
    ['2026-09-21T08:00:00Z', 'Last done 21 Sep'],
  ])('reads %s as "%s"', (lastDoneAt, label) => {
    expect(lastDoneLabel(lastDoneAt, now)).toBe(label)
  })
})

describe("lastDoneLabel in the phone's time zone", () => {
  it('reads a workout from this evening in Ecuador as today, not tomorrow', () => {
    // 20:24 and 21:37 on Sunday 4 October in Guayaquil, both already Monday in UTC.
    expect(
      lastDoneLabel(
        '2026-10-05T01:24:20.089Z',
        new Date('2026-10-05T02:37:00Z'),
        'America/Guayaquil',
      ),
    ).toBe('Last done today')
  })

  it('names the local weekday', () => {
    expect(
      lastDoneLabel(
        '2026-10-05T01:24:20.089Z',
        new Date('2026-10-07T15:00:00Z'),
        'America/Guayaquil',
      ),
    ).toBe('Last done Sunday')
  })
})
