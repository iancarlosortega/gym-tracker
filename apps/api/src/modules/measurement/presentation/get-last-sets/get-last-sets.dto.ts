import { IsOptional, IsUUID } from 'class-validator'

export class GetLastSetsDto {
  /** The session being logged; its sets are not "last time". */
  @IsOptional()
  @IsUUID('all')
  excludingSession?: string
}
