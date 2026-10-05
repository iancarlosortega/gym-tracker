# Proposal: Routine editor polish

## Intent
These items came out of Ian's device checks on 2026-10-04:
- **Exercise order:** the routine-list drag works well, but a routine's own exercises still reorder only with large arrow buttons.
- **Done button:** in the editor it is a filled pill with a check icon, which feels out of place.
- **Empty routine:** it offers no way to add an exercise without entering edit mode first.

## Scope
### In Scope
- **Exercise order:** in the routine editor, exercises reorder by dragging a handle or with small Move up and Move down arrows. This is the same component as the routine list, made generic.
- **Done:** it becomes plain primary-coloured text at the top right, iOS style. The owner chose this.
- **Empty plan:** a routine with no exercises reads "No exercises yet." with an **Add exercises** button. It opens the editor with the exercise picker already open.

### Out of Scope
- Any API change: entry reorder already exists and is optimistic.

## Capabilities
### Modified Capabilities
- `routines`: entries reorder by drag; an empty routine offers adding exercises directly.

## Approach
1. Generalise `SortableRoutineList` into `SortableList<T extends { id }>`. It takes `label(item)` for the accessible names and `card(item)` for each row. Both the routine list and the entry list use it.
2. `RoutineEditor` gains `initiallyAdding`.
3. `RoutinePlan` gains an `onAddExercises` callback.

## Risks
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Dragging an entry row instead of tapping it to edit | Low | The drag starts from the handle only, the same as the routine list. |

## Success Criteria
- [ ] Exercises in a routine can be dragged into a new order, and the order persists.
- [ ] Done reads as text at the top right.
- [ ] An empty routine offers Add exercises, which goes straight to the picker.
