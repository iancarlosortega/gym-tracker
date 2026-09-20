import { IsString, MinLength } from 'class-validator'

export class ApplyRecomputeDto {
  /** The token from the preview the user actually looked at. */
  @IsString()
  @MinLength(1)
  previewToken!: string
}
