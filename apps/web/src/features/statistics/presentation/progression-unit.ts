import { type DisplayUnit, kilogramsToDisplay } from '@/lib/units'
import type { ExerciseProgressionResponse } from '../infrastructure/statistics.api'

type Series = ExerciseProgressionResponse['series'][number]

/** The API charts in kilograms; the screen charts in the user's unit. Pin positions stay as they are. */
export const inDisplayUnit = (series: Series, unit: DisplayUnit): Series =>
  series.unit === 'position'
    ? series
    : {
        ...series,
        points: series.points.map((point) => ({
          ...point,
          value: kilogramsToDisplay(point.value, unit),
        })),
      }
