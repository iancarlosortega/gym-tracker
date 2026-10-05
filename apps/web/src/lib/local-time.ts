/**
 * The phone's IANA time zone, e.g. "America/Guayaquil".
 *
 * Read from the device every time rather than stored, so it follows the phone
 * when it travels. UTC when the runtime cannot say, as on the server render.
 */
export const localTimeZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}
