import { Type } from 'class-transformer'
import { IsDate } from 'class-validator'
import { TimeZoneQuery } from '../time-zone.query.js'

export class ReadWeekDto extends TimeZoneQuery {
  /** Any instant in the week; the phone sends its local Monday at midnight. */
  @Type(() => Date)
  @IsDate()
  weekStart!: Date
}
