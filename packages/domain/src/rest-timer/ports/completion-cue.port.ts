/**
 * The signal that rest is over, for a phone that may be face-down in a bag.
 *
 * Sound and vibration are one port rather than two: they are the same
 * decision — tell the user now, on the device in front of them — and a
 * browser that refuses one usually refuses both for the same reason.
 */
export interface CompletionCue {
  play(): Promise<void>
}
