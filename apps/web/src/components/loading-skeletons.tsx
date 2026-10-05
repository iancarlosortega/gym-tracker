import { Skeleton } from '@/components/ui/skeleton'

/** The words a screen reader hears instead of the shapes. */
const Announce = ({ label }: { readonly label: string }) => (
  <span role="status" className="sr-only">
    {label}
  </span>
)

const Row = () => (
  <div
    data-slot="skeleton-row"
    aria-hidden="true"
    className="flex min-h-touch items-center justify-between gap-3 rounded-xl bg-card px-4 py-3"
  >
    <div className="grid grow gap-2">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
    <Skeleton className="h-4 w-12" />
  </div>
)

/** A list in the shape it is about to take, rather than a sentence saying it is coming. */
export const ListSkeleton = ({
  label,
  rows = 3,
}: {
  readonly label: string
  readonly rows?: number
}) => (
  <div className="grid gap-2">
    <Announce label={label} />
    {Array.from({ length: rows }, (_, index) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no identity
      <Row key={index} />
    ))}
  </div>
)

export const HomeSkeleton = () => (
  <div className="grid gap-6">
    <Announce label="Loading your home" />
    <div aria-hidden="true" className="grid gap-3">
      <Skeleton className="h-10 w-4/5" />
      <Skeleton className="h-10 w-3/5" />
      <Skeleton className="h-4 w-2/5" />
    </div>
    <div aria-hidden="true" className="grid grid-cols-7 gap-1.5">
      {Array.from({ length: 7 }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: placeholders have no identity
        <Skeleton key={index} className="h-10 rounded-lg" />
      ))}
    </div>
    <div aria-hidden="true" className="grid grid-cols-2 gap-3">
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
    </div>
    <div aria-hidden="true" className="grid gap-2">
      <Row />
      <Row />
    </div>
  </div>
)

export const PlanSkeleton = () => (
  <div className="grid gap-5">
    <Announce label="Loading the plan" />
    <Skeleton aria-hidden="true" className="h-8 w-1/2" />
    <div aria-hidden="true" className="grid gap-2">
      <Row />
      <Row />
      <Row />
    </div>
    <Skeleton aria-hidden="true" className="h-14 rounded-2xl" />
  </div>
)
