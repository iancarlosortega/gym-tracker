import { Type } from 'class-transformer'
import { IsDate, IsUUID } from 'class-validator'

export class ScheduleRestPushDto {
  /** The set whose rest this alert ends; cancelling names the same id. */
  @IsUUID()
  setId!: string

  @Type(() => Date)
  @IsDate()
  fireAt!: Date
}
