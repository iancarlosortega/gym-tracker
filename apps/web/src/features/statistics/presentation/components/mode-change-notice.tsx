import { TriangleAlert } from 'lucide-react'

export interface ModeChangeNoticeProps {
  readonly changes: readonly { readonly at: string; readonly from: string; readonly to: string }[]
}

/**
 * Says an exercise changed how it is measured, rather than drawing through it.
 *
 * The numbers on either side are on different scales. A single continuous
 * line across the change would claim they are comparable, which is the whole
 * thing this product refuses to do.
 */
export const ModeChangeNotice = ({ changes }: ModeChangeNoticeProps) => {
  if (changes.length === 0) {
    return null
  }

  return (
    <p className="flex items-start gap-2 rounded-md border border-destructive px-4 py-3 text-sm">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
      <span>
        Measurement changed on{' '}
        {new Date(changes[0]?.at ?? '').toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
        })}
        . Each measurement keeps its own chart, because the numbers are not comparable.
      </span>
    </p>
  )
}
