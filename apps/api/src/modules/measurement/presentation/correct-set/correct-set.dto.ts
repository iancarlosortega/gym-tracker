import {
  IsInt,
  Min,
  Validate,
  ValidateIf,
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator'

/** A set is measured one way, so its correction names one kind of load. */
@ValidatorConstraint({ name: 'singleLoad' })
class SingleLoad implements ValidatorConstraintInterface {
  validate(_position: unknown, args: ValidationArguments): boolean {
    return (args.object as CorrectSetDto).grams === undefined
  }

  defaultMessage(): string {
    return 'Send grams or a position, not both.'
  }
}

/** The same value shape as logging a set, so the client has one encoding. */
export class CorrectSetDto {
  /** The load in grams as typed; the per-side load for a PER_SIDE set. Required without a position. */
  @ValidateIf((body: CorrectSetDto) => body.grams !== undefined || body.position === undefined)
  @IsInt()
  @Min(0)
  grams?: number

  /** The pin position, for a stack set. */
  @ValidateIf((body: CorrectSetDto) => body.position !== undefined)
  @IsInt()
  @Min(1)
  @Validate(SingleLoad)
  position?: number

  @IsInt()
  @Min(1)
  reps!: number
}
