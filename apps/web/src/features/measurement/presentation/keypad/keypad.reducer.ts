export type KeypadField = 'weight' | 'reps'

export interface KeypadState {
  readonly field: KeypadField
  readonly weight: string
  readonly reps: string
  /** The first key after a field is opened replaces its value instead of appending. */
  readonly replaceNext: boolean
}

export type KeypadAction =
  | { readonly type: 'digit'; readonly digit: string }
  | { readonly type: 'decimal' }
  | { readonly type: 'delete' }
  | { readonly type: 'step'; readonly direction: 1 | -1 }
  | {
      readonly type: 'sameAsLast'
      readonly last: { readonly weight: number; readonly reps: number }
    }
  | { readonly type: 'switchField'; readonly field?: KeypadField }

const WEIGHT_STEP = 2.5
const REPS_STEP = 1
const MAX_LENGTH = 6

export const openKeypad = (
  values: { readonly weight: string; readonly reps: string },
  field: KeypadField,
): KeypadState => ({ ...values, field, replaceNext: true })

/** Up to two decimals, without trailing zeros: 22.5, not 22.50. */
const format = (value: number): string => String(Math.round(value * 100) / 100)

const edit = (state: KeypadState, change: (current: string) => string): KeypadState => {
  const current = state.replaceNext ? '' : state[state.field]
  const next = change(current)
  return next.length > MAX_LENGTH ? state : { ...state, [state.field]: next, replaceNext: false }
}

/**
 * The keypad's whole behaviour, pure, so it is tested without a screen.
 *
 * Reps are whole numbers, so the decimal key does nothing there.
 */
export const keypadReducer = (state: KeypadState, action: KeypadAction): KeypadState => {
  switch (action.type) {
    case 'digit':
      return edit(state, (current) => (current === '0' ? action.digit : current + action.digit))
    case 'decimal':
      if (state.field === 'reps') return state
      return edit(state, (current) =>
        current.includes('.') ? current : `${current === '' ? '0' : current}.`,
      )
    case 'delete':
      return { ...state, [state.field]: state[state.field].slice(0, -1), replaceNext: false }
    case 'step': {
      const step = state.field === 'weight' ? WEIGHT_STEP : REPS_STEP
      const value = Math.max(0, (Number(state[state.field]) || 0) + action.direction * step)
      return { ...state, [state.field]: format(value), replaceNext: false }
    }
    case 'sameAsLast':
      return {
        ...state,
        weight: format(action.last.weight),
        reps: String(action.last.reps),
        replaceNext: true,
      }
    case 'switchField':
      return {
        ...state,
        field: action.field ?? (state.field === 'weight' ? 'reps' : 'weight'),
        replaceNext: true,
      }
  }
}

const toNumber = (value: string): number | null =>
  value === '' || value.endsWith('.') || Number.isNaN(Number(value)) ? null : Number(value)

/** What would be logged: null for a value not entered or not finished. */
export const keypadValues = (state: KeypadState) => ({
  weight: toNumber(state.weight),
  reps: toNumber(state.reps),
})
