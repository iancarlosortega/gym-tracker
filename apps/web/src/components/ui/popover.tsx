'use client'

import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { cn } from 'cn'

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverTitle({ ...props }: PopoverPrimitive.Title.Props) {
  return <PopoverPrimitive.Title data-slot="popover-title" {...props} />
}

type PopoverContentProps = PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, 'side' | 'align' | 'sideOffset' | 'collisionPadding'>

/**
 * The popup, its caret and a scrim. The scrim sits under the fixed tab bar (z-40), so the
 * button that opened the popup stays lit; the popup grows out of it via --transform-origin.
 */
function PopoverContent({
  className,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 14,
  collisionPadding = 12,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Backdrop
        data-slot="popover-backdrop"
        className="fixed inset-0 z-30 bg-black/55 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none supports-backdrop-filter:backdrop-blur-[2px]"
      />
      <PopoverPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className="z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-popup"
          className={cn(
            'relative origin-(--transform-origin) rounded-2xl border bg-popover text-popover-foreground text-sm shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)] outline-none',
            'transition-[scale,opacity] duration-300 ease-[cubic-bezier(0.3,1.35,0.5,1)] data-ending-style:scale-75 data-starting-style:scale-50 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:duration-150 data-ending-style:ease-out motion-reduce:transition-none',
            className,
          )}
          {...props}
        >
          {children}
          <PopoverPrimitive.Arrow
            data-slot="popover-arrow"
            className="data-[side=top]:-bottom-[7px] data-[side=bottom]:-top-[7px] data-[side=bottom]:rotate-[225deg] size-3.5 rotate-45 rounded-br-[3px] border-r border-b bg-popover"
          />
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverContent, PopoverTitle, PopoverTrigger }
