'use client'

import type { Clock } from '@gym/domain/auth/ports/clock.port'
import type { CompletionCue } from '@gym/domain/rest-timer/ports/completion-cue.port'
import type { ScreenWakeLock } from '@gym/domain/rest-timer/ports/screen-wake-lock.port'
import type { RestInterval } from '@gym/domain/rest-timer/value-objects/rest-interval.vo'
import { useCallback, useEffect, useState } from 'react'
import { DismissRestUseCase } from '../../application/dismiss-rest.use-case'
import { RestCountdown } from '../components/rest-countdown'

export interface RestTimerContainerProps {
  readonly interval: RestInterval
  readonly exerciseName: string
  readonly lastSet: string
  readonly clock: Clock
  readonly wakeLock: ScreenWakeLock
  readonly cue: CompletionCue
  readonly onFinished: () => void
  readonly onAdjust: (seconds: number) => void
}

/**
 * Drives the countdown and hands the screen back when it is over.
 *
 * The remaining time is recomputed from the interval on every tick rather
 * than decremented, so a tab that was throttled in the background — which is
 * exactly what happens when the phone is pocketed — comes back showing the
 * truth instead of however many ticks it managed to run.
 *
 * The wake lock is re-acquired when the page becomes visible again, because
 * browsers drop it on hide and never give it back on their own.
 */
export const RestTimerContainer = ({
  interval,
  exerciseName,
  lastSet,
  clock,
  wakeLock,
  cue,
  onFinished,
  onAdjust,
}: RestTimerContainerProps) => {
  const [remaining, setRemaining] = useState(() => interval.remainingSecondsAt(clock.now()))

  const finish = useCallback(async () => {
    await new DismissRestUseCase(wakeLock).execute()
    onFinished()
  }, [wakeLock, onFinished])

  useEffect(() => {
    const tick = setInterval(() => {
      setRemaining(interval.remainingSecondsAt(clock.now()))
    }, 250)

    return () => clearInterval(tick)
  }, [interval, clock])

  useEffect(() => {
    const onVisibilityChange = () => {
      void (document.visibilityState === 'visible' ? wakeLock.acquire() : wakeLock.release())
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [wakeLock])

  useEffect(() => {
    if (remaining > 0) {
      return
    }

    void cue.play()
    void finish()
  }, [remaining, cue, finish])

  return (
    <RestCountdown
      remainingSeconds={remaining}
      totalSeconds={interval.seconds}
      exerciseName={exerciseName}
      lastSet={lastSet}
      onAdjust={onAdjust}
      onSkip={() => void finish()}
    />
  )
}
