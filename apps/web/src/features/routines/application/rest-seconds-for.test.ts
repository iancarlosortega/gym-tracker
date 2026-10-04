import { describe, expect, it } from 'vitest'
import { FALLBACK_REST_SECONDS, restSecondsFor } from './rest-seconds-for.ts'

const entry = (exerciseId: string, restSeconds: number) => ({ exerciseId, restSeconds })

describe('restSecondsFor', () => {
  it('uses the rest the routine sets for that exercise', () => {
    const rest = restSecondsFor([entry('squat', 180), entry('leg-curl', 90)])

    expect(rest('leg-curl')).toBe(90)
  })

  it('falls back to three minutes for an exercise outside the routine', () => {
    expect(restSecondsFor([entry('squat', 120)])('calf-raise')).toBe(180)
  })

  it('falls back to three minutes for an empty workout', () => {
    expect(restSecondsFor(null)('squat')).toBe(FALLBACK_REST_SECONDS)
    expect(FALLBACK_REST_SECONDS).toBe(180)
  })
})
