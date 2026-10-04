import { describe, expect, it } from 'vitest'
import {
  type KeypadAction,
  type KeypadState,
  keypadReducer,
  keypadValues,
  openKeypad,
} from './keypad.reducer.ts'

const press = (state: KeypadState, ...actions: KeypadAction[]) =>
  actions.reduce(keypadReducer, state)
const digit = (value: string): KeypadAction => ({ type: 'digit', digit: value })

const editingWeight = (weight = '20', reps = '8') => openKeypad({ weight, reps }, 'weight')

describe('the keypad', () => {
  it('replaces the value with the first key, then appends', () => {
    expect(
      press(editingWeight(), digit('2'), digit('2'), { type: 'decimal' }, digit('5')).weight,
    ).toBe('22.5')
  })

  it('takes one decimal point at most', () => {
    const state = press(
      editingWeight(),
      digit('2'),
      { type: 'decimal' },
      { type: 'decimal' },
      digit('5'),
    )

    expect(state.weight).toBe('2.5')
  })

  it('starts a value at "0." when the decimal comes first', () => {
    expect(press(editingWeight(), { type: 'decimal' }).weight).toBe('0.')
  })

  it('keeps reps whole', () => {
    const state = press(
      openKeypad({ weight: '20', reps: '8' }, 'reps'),
      digit('1'),
      { type: 'decimal' },
      digit('2'),
    )

    expect(state.reps).toBe('12')
  })

  it('deletes the last character', () => {
    expect(press(editingWeight('22.5'), { type: 'delete' }).weight).toBe('22.')
  })

  it('steps the weight by 2.5 and never below zero', () => {
    expect(press(editingWeight('20'), { type: 'step', direction: 1 }).weight).toBe('22.5')
    expect(press(editingWeight('1'), { type: 'step', direction: -1 }).weight).toBe('0')
  })

  it('steps reps by one', () => {
    expect(
      press(openKeypad({ weight: '20', reps: '8' }, 'reps'), { type: 'step', direction: 1 }).reps,
    ).toBe('9')
  })

  it('fills both values from last time', () => {
    const state = press(editingWeight(''), { type: 'sameAsLast', last: { weight: 20, reps: 7 } })

    expect(keypadValues(state)).toEqual({ weight: 20, reps: 7 })
  })

  it('switches to the other value, ready to be replaced', () => {
    const state = press(editingWeight('20', '8'), { type: 'switchField' }, digit('6'))

    expect(state.field).toBe('reps')
    expect(state.reps).toBe('6')
  })

  it('reads an empty or unfinished value as nothing yet', () => {
    expect(keypadValues(openKeypad({ weight: '', reps: '8' }, 'weight'))).toEqual({
      weight: null,
      reps: 8,
    })
  })
})
