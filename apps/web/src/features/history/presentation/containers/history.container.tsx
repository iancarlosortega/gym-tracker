'use client'

import { type LocalDate, localDate } from '@gym/domain/shared/services/local-calendar'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ListSkeleton } from '@/components/loading-skeletons'
import { OfflineNotice } from '@/components/query-state'
import { localTimeZone } from '@/lib/local-time'
import { HistoryCalendar } from '../components/history-calendar'
import { HistoryList } from '../components/history-list'
import { type HistoryView, HistoryViewToggle } from '../components/history-view-toggle'
import { useMonthHistory, useWorkoutHistory } from '../history.queries'
import {
  addMonths,
  byLocalDay,
  type Month,
  monthGrid,
  monthOf,
  monthTitle,
} from '../history-calendar'
import { groupByWeek } from '../history-grouping'

export interface HistoryContainerProps {
  /** Injected for tests; the phone's clock and zone otherwise. */
  readonly now?: Date
  readonly zone?: string
}

const failedRead = <p role="alert">Could not reach the server, so your history cannot be shown.</p>

/**
 * History opens as a list; the calendar is one tap away. The view lives in the
 * address, so coming back from a workout returns to the same one.
 */
export const HistoryContainer = ({
  now = new Date(),
  zone = localTimeZone(),
}: HistoryContainerProps) => {
  const view: HistoryView = useSearchParams().get('view') === 'calendar' ? 'calendar' : 'list'
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">History</h1>
        <HistoryViewToggle
          view={view}
          onChange={(next) =>
            router.replace(next === 'calendar' ? `${pathname}?view=calendar` : pathname)
          }
        />
      </div>
      {view === 'list' ? (
        <ListView now={now} zone={zone} />
      ) : (
        <CalendarView now={now} zone={zone} />
      )}
    </div>
  )
}

const ListView = ({ now, zone }: { readonly now: Date; readonly zone: string }) => {
  const history = useWorkoutHistory()

  if (history.isPending) {
    return history.fetchStatus === 'paused' ? (
      <OfflineNotice />
    ) : (
      <ListSkeleton label="Loading your history" />
    )
  }
  if (history.isError) return failedRead

  return (
    <HistoryList
      weeks={groupByWeek(
        history.data.pages.flatMap((page) => page.items),
        now,
        zone,
      )}
      zone={zone}
      hasMore={history.hasNextPage}
      loadingMore={history.isFetchingNextPage}
      onLoadMore={() => history.fetchNextPage()}
    />
  )
}

const CalendarView = ({ now, zone }: { readonly now: Date; readonly zone: string }) => {
  const today = localDate(now, zone)
  const [month, setMonth] = useState<Month>(() => monthOf(now, zone))
  const [selected, setSelected] = useState<LocalDate | null>(today)
  const history = useMonthHistory(month, zone)

  const move = (months: number) => {
    setMonth(addMonths(month, months))
    setSelected(null)
  }

  if (history.isPending) {
    return history.fetchStatus === 'paused' ? (
      <OfflineNotice />
    ) : (
      <ListSkeleton label="Loading the month" />
    )
  }
  if (history.isError) return failedRead

  const days = byLocalDay(history.data.items, zone)

  return (
    <HistoryCalendar
      title={monthTitle(month)}
      weeks={monthGrid(month)}
      trained={new Set(days.keys())}
      today={today}
      selected={selected}
      dayEntries={selected === null ? [] : (days.get(selected) ?? [])}
      zone={zone}
      onSelect={setSelected}
      onPrevious={() => move(-1)}
      onNext={() => move(1)}
    />
  )
}
