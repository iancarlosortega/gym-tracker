import { Type } from 'class-transformer'
import { IsDate } from 'class-validator'
import { TimeZoneQuery } from '../time-zone.query.js'

export class ReadVolumeDto extends TimeZoneQuery {
  @Type(() => Date)
  @IsDate()
  from!: Date

  @Type(() => Date)
  @IsDate()
  to!: Date
}
