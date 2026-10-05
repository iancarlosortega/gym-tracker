import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { ReadWeekDto } from './read-week/read-week.dto.ts'

const failed = (query: Record<string, string>) =>
  validateSync(plainToInstance(ReadWeekDto, query)).map((error) => error.property)

describe('the time zone a statistics read may name', () => {
  it("accepts the phone's IANA zone", () => {
    expect(failed({ weekStart: '2026-09-28T05:00:00Z', timeZone: 'America/Guayaquil' })).toEqual([])
  })

  it('may be left out, which reads in UTC', () => {
    expect(failed({ weekStart: '2026-09-28T00:00:00Z' })).toEqual([])
  })

  it('refuses a zone that does not exist', () => {
    expect(failed({ weekStart: '2026-09-28T00:00:00Z', timeZone: 'Mars/Olympus' })).toContain(
      'timeZone',
    )
  })
})
