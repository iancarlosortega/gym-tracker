import type { ProgressionSeriesResponse } from '../../infrastructure/http-statistics.gateway'

export interface ProgressionChartProps {
  readonly series: ProgressionSeriesResponse
}

const WIDTH = 330
const HEIGHT = 140
const PADDING = 26

/**
 * One series, drawn in the shape its scale deserves.
 *
 * A mass series is a line: kilograms are continuous, and the slope between
 * two weeks is a real quantity. An ordinal series is bars, because pin
 * positions step between stacks rather than sloping between them — a line
 * would claim a position of 6.5 exists somewhere between them.
 *
 * The repetitions of each top set are printed under every point either way,
 * since the same load for more reps is progress a load-only chart draws flat.
 */
export const ProgressionChart = ({ series }: ProgressionChartProps) => {
  const points = series.points

  if (points.length === 0) {
    return <p className="text-muted-foreground text-sm">Nothing logged in this period.</p>
  }

  const values = points.map((point) => point.value)
  const highest = Math.max(...values)
  const lowest = Math.min(...values, 0)
  const span = highest - lowest || 1

  const x = (index: number) =>
    points.length === 1
      ? WIDTH / 2
      : PADDING + (index * (WIDTH - PADDING * 2)) / (points.length - 1)
  const y = (value: number) => HEIGHT - PADDING - ((value - lowest) / span) * (HEIGHT - PADDING * 2)

  const label = `${series.unit === 'position' ? 'Pin position' : 'Weight'} by week`

  return (
    <figure className="m-0 grid gap-2">
      <svg
        aria-label={label}
        height={HEIGHT}
        role="img"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
      >
        <line
          stroke="var(--border)"
          strokeWidth="1"
          x1={PADDING - 10}
          x2={WIDTH - PADDING + 10}
          y1={HEIGHT - PADDING}
          y2={HEIGHT - PADDING}
        />

        {series.unit === 'position'
          ? points.map((point, index) => (
              <rect
                fill="var(--primary)"
                height={Math.max(HEIGHT - PADDING - y(point.value), 4)}
                key={point.periodStart}
                rx="4"
                width="26"
                x={x(index) - 13}
                y={y(point.value)}
              />
            ))
          : [
              <polyline
                fill="none"
                key="line"
                points={points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')}
                stroke="var(--primary)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />,
              ...points.map((point, index) => (
                <circle
                  cx={x(index)}
                  cy={y(point.value)}
                  fill="var(--primary)"
                  key={point.periodStart}
                  r="5"
                />
              )),
            ]}

        {points.map((point, index) => (
          <text
            fill="var(--muted-foreground)"
            fontSize="11"
            key={`reps-${point.periodStart}`}
            textAnchor="middle"
            x={x(index)}
            y={HEIGHT - 6}
          >
            {point.reps} reps
          </text>
        ))}
      </svg>
      <figcaption className="text-muted-foreground text-sm">
        {series.unit === 'position'
          ? 'Pin positions step between stacks, so they are drawn as steps rather than a slope.'
          : 'The reps of each top set sit below it: the same weight for more reps is progress too.'}
      </figcaption>
    </figure>
  )
}
