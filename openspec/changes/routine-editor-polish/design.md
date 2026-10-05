# Design — routine-editor-polish

## D1. A generic sortable list
`components/sortable-routine-list.tsx` becomes `components/sortable-list.tsx`.

It exports `SortableList<T extends { id: string }>` with these props:
- `items`
- `label(item)`: used in "Drag {label} to reorder", "Move {label} up" and the announcements.
- `card(item)`: the row content.
- `onReorder(ids)`

The behaviour is unchanged:
- MouseSensor, distance 5.
- TouchSensor, delay 250 and tolerance 5.
- KeyboardSensor.
- The handle has `touch-none`, `select-none` and no callout.

`RoutineCards` passes `label={(routine) => routine.name}`.

## D2. RoutineEditor
- **Entries:** the entries render through `SortableList`. Each row's card is the existing "Edit {name}" button, styled as a `bg-card` row with `flex-1`. The large `ArrowUp`/`ArrowDown` buttons are removed.
- **Done:** `<Button variant="ghost" className="min-h-touch px-2 font-semibold text-base text-primary">Done</Button>`. It is plain text with no icon.
- **New prop:** `initiallyAdding?: boolean` seeds the `adding` state.

## D3. RoutinePlan and its container
- **RoutinePlan:** a new prop, `onAddExercises: () => void`. When there are no entries, it shows "No exercises yet." and an outline button: Plus, "Add exercises".
- **RoutinePlanContainer:**
  - It keeps `editing: false | 'plan' | 'adding'`.
  - `onAddExercises` sets `'adding'`.
  - `RoutineEditor` receives `initiallyAdding={editing === 'adding'}`.

## D4. Slice
There is one unit, about 200 lines. It follows strict TDD and updates the editor and plan tests.
