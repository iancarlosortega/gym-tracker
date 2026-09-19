/**
 * An immutable, closed set of filters for a repository query.
 *
 * `TFields` is declared per repository and lists only the filters that
 * repository actually supports. Criteria is therefore never a predicate
 * language and never `Partial<Entity>`: adding a filter means editing that
 * repository's field type, which is a decision that shows up in review rather
 * than a caller inventing a query the domain never sanctioned.
 *
 * Narrowing returns a new instance, so a criteria object can be passed around
 * and refined without any caller being surprised by a change made elsewhere.
 */
export class Criteria<TFields extends object> {
  private constructor(private readonly fields: Readonly<Partial<TFields>>) {
    Object.freeze(this.fields)
    Object.freeze(this)
  }

  static none<TFields extends object>(): Criteria<TFields> {
    return new Criteria<TFields>({} as Partial<TFields>)
  }

  static of<TFields extends object>(fields: Partial<TFields>): Criteria<TFields> {
    return new Criteria<TFields>(Criteria.compact(fields))
  }

  /**
   * Drop keys whose value is `undefined` so that an explicitly-undefined
   * filter and an absent one mean the same thing. Without this, adapters would
   * have to distinguish `{ id: undefined }` from `{}` and would eventually get
   * it wrong in opposite directions.
   */
  private static compact<TFields extends object>(
    fields: Partial<TFields>,
  ): Readonly<Partial<TFields>> {
    const compacted: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        compacted[key] = value
      }
    }
    return compacted as Partial<TFields>
  }

  /** The filters, for an adapter to translate. Frozen. */
  get value(): Readonly<Partial<TFields>> {
    return this.fields
  }

  isEmpty(): boolean {
    return this.keys().length === 0
  }

  keys(): readonly (keyof TFields & string)[] {
    return Object.keys(this.fields) as (keyof TFields & string)[]
  }

  has<TKey extends keyof TFields>(key: TKey): boolean {
    return this.fields[key] !== undefined
  }

  get<TKey extends keyof TFields>(key: TKey): TFields[TKey] | undefined {
    return this.fields[key]
  }

  /** Add or replace filters, returning a new criteria. */
  with(fields: Partial<TFields>): Criteria<TFields> {
    return Criteria.of<TFields>({ ...this.fields, ...fields } as Partial<TFields>)
  }

  /** Remove filters, returning a new criteria. */
  without(...keys: readonly (keyof TFields)[]): Criteria<TFields> {
    const remaining = { ...this.fields }
    for (const key of keys) {
      delete remaining[key]
    }
    return Criteria.of<TFields>(remaining)
  }
}
