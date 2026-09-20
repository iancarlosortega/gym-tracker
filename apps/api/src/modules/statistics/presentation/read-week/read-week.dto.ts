import { Type } from 'class-transformer'
import { IsDate } from 'class-validator'

export class ReadWeekDto {
  /** The Monday the week starts on. */
  @Type(() => Date)
  @IsDate()
  weekStart!: Date
}
