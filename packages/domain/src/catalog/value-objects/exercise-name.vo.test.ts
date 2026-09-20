import { describe, expect, it } from 'vitest'
import { ExerciseName } from './exercise-name.vo.ts'

describe('exercise name', () => {
  it('keeps the name as written', () => {
    expect(ExerciseName.create('Bench Press').value).toBe('Bench Press')
  })

  it('trims surrounding whitespace', () => {
    expect(ExerciseName.create('  Lat Pulldown  ').value).toBe('Lat Pulldown')
  })

  it('rejects an empty name', () => {
    expect(() => ExerciseName.create('   ')).toThrow(/name/i)
  })

  it('rejects a name longer than a label could ever need', () => {
    expect(() => ExerciseName.create('x'.repeat(121))).toThrow(/name/i)
  })

  it('compares case-insensitively, so one exercise is not created twice', () => {
    expect(ExerciseName.create('Bench Press').equals(ExerciseName.create('bench press'))).toBe(true)
  })
})
