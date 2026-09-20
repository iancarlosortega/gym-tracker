import type { CompletionCue } from '@gym/domain/rest-timer/ports/completion-cue.port'

const TONE_HZ = 880
const TONE_SECONDS = 0.18
const VIBRATE_PATTERN = [120, 80, 120]

/**
 * A short tone and a buzz when rest ends.
 *
 * Synthesised rather than played from a file: it is two hundred milliseconds
 * of sine wave, and an audio file would be one more asset to cache, to ship,
 * and to have fail silently on a device that never fetched it.
 *
 * Both halves are attempted and neither is required. Audio is blocked until
 * the page has been interacted with, which by this point it has — the user
 * pressed "Log set" to get here — but a refusal still leaves the visual cue
 * doing its job.
 */
export class WebAudioCompletionCue implements CompletionCue {
  private context: AudioContext | null = null

  async play(): Promise<void> {
    this.vibrate()
    await this.tone()
  }

  private vibrate(): void {
    try {
      navigator.vibrate?.(VIBRATE_PATTERN)
    } catch {
      // Unsupported or refused; the tone and the screen still say it is over.
    }
  }

  private async tone(): Promise<void> {
    try {
      this.context ??= new AudioContext()
      await this.context.resume()

      const oscillator = this.context.createOscillator()
      const gain = this.context.createGain()

      oscillator.frequency.value = TONE_HZ
      gain.gain.value = 0.2
      oscillator.connect(gain).connect(this.context.destination)

      oscillator.start()
      oscillator.stop(this.context.currentTime + TONE_SECONDS)
    } catch {
      // Autoplay policy or no audio device. The countdown still finished.
    }
  }
}
