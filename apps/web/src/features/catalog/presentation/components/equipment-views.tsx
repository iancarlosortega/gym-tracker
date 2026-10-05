import { ChevronRight, Pencil, Plus, Scale } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { type DisplayUnit, kilogramsToDisplay, unitLabel } from '@/lib/units'
import type { EquipmentResponse } from '../../../workouts/infrastructure/workouts.api'
import type { EquipmentUsageResponse } from '../../infrastructure/equipment.api'

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

export const equipmentSummary = (
  equipment: EquipmentResponse,
  unit: DisplayUnit = 'KG',
): string => {
  if (equipment.kind === 'BARBELL') {
    return equipment.barKilograms === null
      ? 'plates · bar not counted'
      : `bar ${kilogramsToDisplay(equipment.barKilograms, unit)} ${unitLabel(unit)}`
  }
  if (equipment.stackPositions !== null) return `stack · ${equipment.stackPositions} positions`
  return 'free weight'
}

export const usageLabel = (usage: EquipmentUsageResponse): string =>
  usage.sets === 0
    ? 'Not used yet'
    : `${plural(usage.exercises, 'exercise', 'exercises')} · ${plural(usage.sets, 'logged set', 'logged sets')}`

export const EquipmentList = ({
  equipment,
  unit = 'KG',
  onNew,
}: {
  readonly equipment: readonly EquipmentResponse[]
  readonly unit?: DisplayUnit
  readonly onNew: () => void
}) => {
  const active = equipment.filter((item) => !item.archived)

  if (active.length === 0) {
    return (
      <div className="grid justify-items-center gap-3 py-10 text-center">
        <p className="text-muted-foreground">No equipment yet.</p>
        <Button className="min-h-touch" onClick={onNew}>
          <Plus className="size-5" />
          Add your first equipment
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <Button variant="outline" className="min-h-touch justify-self-start" onClick={onNew}>
        <Plus className="size-5" />
        New equipment
      </Button>
      <ul className="grid gap-2">
        {active.map((item) => (
          <li key={item.id}>
            <Link
              href={`/equipment/${item.id}`}
              className="flex min-h-touch items-center justify-between gap-3 rounded-xl bg-card px-4 py-3"
            >
              <span>{item.name}</span>
              <span className="flex items-center gap-2 text-muted-foreground text-sm">
                {equipmentSummary(item, unit)}
                <ChevronRight className="size-4" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export interface EquipmentDetailsProps {
  readonly equipment: EquipmentResponse
  /** Null while it is being read, or when it could not be. */
  readonly usage: EquipmentUsageResponse | null
  readonly unit?: DisplayUnit
  readonly onEdit: () => void
  readonly onChangeBar: () => void
}

export const EquipmentDetails = ({
  equipment,
  usage,
  unit = 'KG',
  onEdit,
  onChangeBar,
}: EquipmentDetailsProps) => (
  <div className="grid gap-4">
    <Card>
      <CardContent className="grid gap-3">
        {equipment.kind === 'BARBELL' && (
          <div className="grid gap-1">
            <span className="text-muted-foreground text-sm">Bar or sled weight</span>
            <strong className="text-2xl">
              {equipment.barKilograms === null
                ? 'Not counted'
                : `${kilogramsToDisplay(equipment.barKilograms, unit)} ${unitLabel(unit)}`}
            </strong>
            <span className="text-muted-foreground text-sm">
              {equipment.barKilograms === null
                ? 'Sets on it count only the plates.'
                : 'Counted in every set logged per side on it.'}
            </span>
            <Button
              variant="ghost"
              className="min-h-touch justify-self-start px-0 font-medium text-primary"
              onClick={onChangeBar}
            >
              <Scale className="size-4" />
              Change the bar weight
            </Button>
          </div>
        )}
        {equipment.stackPositions !== null && (
          <div className="grid gap-1">
            <span className="text-muted-foreground text-sm">Weight stack</span>
            <strong className="text-2xl">{equipment.stackPositions} positions</strong>
          </div>
        )}
        {usage !== null && <p className="text-muted-foreground text-sm">{usageLabel(usage)}</p>}
      </CardContent>
    </Card>

    <Button variant="outline" className="min-h-touch text-base" onClick={onEdit}>
      <Pencil className="size-5" />
      Rename or archive
    </Button>
  </div>
)
