/** Monday, so a week is the week a lifter thinks in. */
export const startOfWeek = (instant: Date): Date => {
  const start = new Date(
    Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate()),
  )
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))

  return start
}
