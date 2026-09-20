import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

/**
 * The paging query every list endpoint accepts.
 *
 * Shared rather than redeclared per module, so no endpoint can quietly ship
 * without a bound. The maximum here mirrors the domain's clamp: this rejects
 * an absurd request at the edge with a clear 400, and `Pagination` still
 * clamps anything that reaches it by another route.
 */
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number
}
