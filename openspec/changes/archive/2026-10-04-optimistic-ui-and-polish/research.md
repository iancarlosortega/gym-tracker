# Research — optimistic-ui-and-polish

```yaml
schema: gentle-ai.sdd-research/v1
revision: 1
outcome: done
accessed_at: 2026-10-04
```

## Questions

- **R1**: What is the TanStack Query v5 optimistic-update shape? Compare the cache approach (`onMutate`, `onError` and `onSettled`, with cancel, snapshot and rollback) with the "via the UI" approach (`variables`, `useMutationState`), and say when each fits.
- **R2**: How should concurrent mutations on the same key be handled, such as rapid reorder taps or a fast kg→lb→kg toggle? This covers `mutationKey`, `isMutating` and v5 `scope`.
- **R3**: How do optimistic writes behave with paused mutations (`networkMode`)? Should the mutation cache be persisted, or should a dedicated IndexedDB queue stay?
- **R4**: When does React 19 `useOptimistic` fit, compared with TanStack?
- **R5**: For a service worker in an App Router PWA on iOS, how does network-first with a timeout compare with stale-while-revalidate? What does `respondWith` cost on cross-origin requests?
- **R6**: What are the pattern and the pitfalls of client-generated UUIDv7 ids for optimistic creates?
- **R7**: What feedback should a failed optimistic update give on rollback?
- **R8**: Which drag-to-reorder approach suits a vertical list of 3–12 routines in an installed iOS PWA running React 19 / Next 16?

## Admission

Sources were public documentation and public web pages, reached through context7, anonymous fetches and `npm view`. No credentials or remote systems were used. Repository files were read locally for context:
- `apps/web/package.json`: `@tanstack/react-query ^5.104.1`, `next ^16.3.5`, `react ^19.3.0`.
- `apps/web/public/sw.js`.

The context7 TanStack snapshot is v5.90.3. Callback signatures were not re-checked against 5.104.

## Sources

| id | class | title | publisher | URL | excerpt |
|---|---|---|---|---|---|
| S1 | official-docs | Optimistic Updates (React, v5) | TanStack | https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates | "use the `onMutate` option to update your cache directly, or leverage the returned `variables` to update your UI" |
| S2 | official-docs | Mutations | TanStack | https://tanstack.com/query/v5/docs/framework/react/guides/mutations | "All mutations with the same `scope.id` will run in serial"; `setMutationDefaults` needed for `resumePausedMutations()` |
| S3 | official-docs | Network Mode | TanStack | https://tanstack.com/query/v5/docs/framework/react/guides/network-mode | `online` is the default; `offlineFirst` "handy if you have a serviceWorker" |
| S4 | official-docs | Migrating to v5 | TanStack | https://github.com/tanstack/query/blob/v5.90.3/docs/framework/react/guides/migrating-to-v5.md | simplified optimistic updates via `variables` + `isPending` |
| S5 | official-docs | Optimistic Updates (v5.90.3) | TanStack | https://github.com/tanstack/query/blob/v5.90.3/docs/framework/react/guides/optimistic-updates.md | `useMutationState({filters:{mutationKey,status:'pending'}})` |
| S6 | official-docs | Persisting mutations | TanStack | https://github.com/tanstack/query/blob/v5.90.3/docs/framework/react/guides/mutations.md | `setMutationDefaults` + `dehydrate`/`hydrate` + `resumePausedMutations()` |
| S7 | source-code | retryer.ts | TanStack | https://github.com/tanstack/query/blob/main/packages/query-core/src/retryer.ts | `canFetch` false offline in `online` mode; `canContinue` also needs focus |
| S8 | blog | Concurrent Optimistic Updates in React Query | TkDodo | https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query | invalidate only when `isMutating({ mutationKey }) === 1` |
| S9 | blog | Mastering Mutations in React Query | TkDodo | https://tkdodo.eu/blog/mastering-mutations-in-react-query | "Optimistic updates are a bit over-used… be sure that it rarely fails" |
| S10 | official-docs | useOptimistic | React | https://react.dev/reference/react/useOptimistic | optimistic state "only renders while an Action is in progress" |
| S11 | source-code | NetworkFirst.ts (Workbox v7) | Workbox | https://github.com/googlechrome/workbox/blob/v7/packages/workbox-strategies/src/NetworkFirst.ts | `networkTimeoutSeconds` races a timer and resolves from the cache |
| S12 | official-docs | Workbox strategies | Chrome for Developers | https://developer.chrome.com/docs/workbox/modules/workbox-strategies | network-first vs stale-while-revalidate |
| S13 | official-docs | The Offline Cookbook | web.dev | https://web.dev/articles/offline-cookbook | slow connection: "wait for the network to fail" |
| S14 | official-docs | FetchEvent.respondWith() | MDN | https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith | prevents the default fetch handling |
| S15 | official-docs | NavigationPreloadManager.enable() | MDN | https://developer.mozilla.org/en-US/docs/Web/API/NavigationPreloadManager/enable | Baseline widely available since April 2022 |
| S16 | article | Navigation preload | web.dev | https://web.dev/navigation-preload/ | SW boot delay ~50 ms, ~250 ms on mobile, >500 ms when stressed |
| S17 | official-docs | PWA guide | Next.js | https://nextjs.org/docs/app/guides/progressive-web-apps | `updateViaCache:'none'`; `sw.js` served no-cache |
| S18 | guidelines (low confidence) | Snackbar | Material Design 3 | https://m3.material.io/components/snackbar/guidelines | snackbars for short outcomes with Undo/Retry |
| S19 | research | Error Message Guidelines | NN/g | https://www.nngroup.com/articles/error-message-guidelines/ | "Display the error message close to the error's source" |
| S20 | standard | RFC 9562 | IETF | https://www.rfc-editor.org/rfc/rfc9562.html | UUIDv7 is time-ordered; "MUST NOT be used as security capabilities" |
| S21 | draft (expired) | Idempotency-Key header | IETF HTTPAPI | https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/ | same key, different payload → 422 |
| S22 | official-docs | Sensors | dnd kit | https://dndkit.com/react/guides/sensors | touch `Delay({value: 250, tolerance: 5})` "to avoid hijacking scroll gestures" |
| S23 | official-docs | PointerSensor | dnd kit | https://dndkit.com/extend/sensors/pointer-sensor | "Longer delays with tolerance for touch"; "Support keyboard input" |
| S24 | official-docs | Migration to @dnd-kit/react | dnd kit | https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/react/guides/migration.mdx | Mouse and Touch merged into PointerSensor |
| S25 | official-docs | Sensors (extending defaults) | dnd kit | https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/react/guides/sensors.mdx | "Always include KeyboardSensor when replacing defaults" |
| S26 | official-docs | Keyboard sensor | dnd kit | https://dndkit.com/extend/sensors/keyboard-sensor | Space/Enter lift, arrows move, Escape cancel |
| S27 | official-docs | Accessibility plugin | dnd kit | https://dndkit.com/extend/plugins/accessibility | configurable screen-reader announcements |
| S28 | official-docs | Touch sensor (legacy) | dnd kit | https://dndkit.com/api-documentation/sensors/touch | "highly recommend… the `touch-action` CSS property" |
| S29 | registry | @dnd-kit/react, core, sortable | npm | https://www.npmjs.com/package/@dnd-kit/react | react 0.5.0 (2026-09); core 6.3.1 / sortable 10.0.0 (2024-12) |
| S30 | registry | @atlaskit/pragmatic-drag-and-drop | npm | https://www.npmjs.com/package/@atlaskit/pragmatic-drag-and-drop | 4.0.0 (2026-09), no react peer |
| S31 | registry | motion | npm | https://www.npmjs.com/package/motion | 14.0.0 (2026-10), peer react ^18 \|\| ^19 |
| S32 | official-docs | Pragmatic drag and drop — About | Atlassian | https://atlassian.design/components/pragmatic-drag-and-drop/about | headless, built on native drag and drop |
| S34 | official-docs | Reorder | Motion | https://motion.dev/docs/react-reorder | handle via `useDragControls`; no accessibility section |

## Validated claims

**R1 — Shapes**
- C1: The cache shape works like this. `onMutate` cancels queries, takes a snapshot and calls `setQueryData`, returning `{previous}`. `onError` restores from that value, and `onSettled` invalidates. [S1, S5]
- C2: The UI shape renders `mutation.variables` while `isPending`. There is no cache write and no rollback. Across components, use `useMutationState` with a `mutationKey`. [S1, S4, S5]
- C3: Not every mutation should be optimistic. Make it optimistic only where it rarely fails and instant feedback matters, such as toggles. Toasts belong in the `mutate()` callbacks, and invalidation belongs in the `useMutation` callbacks. [S9]
- Design consequence:
  - Cache shape for in-place edits of shared lists: unit, routine and catalog rename/archive, reorder, and entry edits.
  - `variables` shape for single-surface pending creates.

**R2 — Races**
- C4: Always `cancelQueries` in `onMutate`. In `onSettled`, invalidate only when `isMutating({mutationKey}) === 1`. [S1, S8]
- C5: Mutations with the same `scope.id` run serially. [S2]
- C6: Rolling back from a snapshot is unsafe when mutations overlap, so prefer serialising or a final invalidate. This is an inference from S1 and S8.
- Design consequence: the reorder and unit mutations get a `mutationKey` and a `scope: {id}`, plus a guarded invalidate. Rapid taps then queue in order.

**R3 — Offline**
- C7: With the default `networkMode: 'online'`, an offline mutation is paused and the `onMutate` state stays applied. Resuming needs the app to be online and focused. [S3, S7]
- C8: Surviving a reload needs a persisted mutation cache with `setMutationDefaults` and `resumePausedMutations()`. The docs do not prefer this over a purpose-built store. [S2, S6]
- Design consequence:
  - Keep the IndexedDB set queue as the only durable offline path.
  - Optimistic non-set edits made offline stay applied while paused, and are lost on reload. That is acceptable for preferences and edits, and is disclosed with the existing offline notice.

**R4 — useOptimistic**
- C9: State lives only during an Action and reverts when the Transition ends. It is not shared through a cache and does not cover long offline pauses. [S10]
- Design consequence: do not use it here; TanStack covers every case.

**R5 — Service worker**
- C10: Plain network-first waits for the network to fail, even on slow links. [S13] Workbox's `networkTimeoutSeconds` races a timer, answers from the cache, and lets the network refresh the cache. [S11]
- C11: Not calling `respondWith` gives the browser's default handling. Calling it adds the SW boot delay on mobile unless navigation preload is enabled, and preload covers navigations only. [S14, S15, S16]
- C12: The current `sw.js` calls `respondWith` on cross-origin API GETs but never caches them. Skipping those requests costs nothing offline (derived from the repo plus S14).
- Design consequence:
  - Skip cross-origin requests.
  - Give same-origin navigations and `?_rsc=` requests network-first with a short timeout, then a cache fallback.
  - Enable navigation preload.
  - Keep `/_next/static` cache-first.
  - Bump the cache name.

**R6 — Client ids**
- C13: UUIDv7 is time-ordered and collisions are negligible. It is not a security capability, and the server must still check ownership. [S20]
- C14: For idempotency, an identical replay should get the same success, and the same id with a different payload should get a conflict. [S21] (pattern only; the draft has expired)
- Design consequence: no further action this change. The owner chose to keep server ids for creates.

**R7 — Rollback UX**
- C15: Show the error near its source, and let the user retry without retyping. [S19] Snackbars suit short outcomes that offer a Retry. [S18] (low confidence)
- C16: `mutate()` callbacks are skipped after an unmount. [S9]
- Design consequence: restore the value in place and show a short message next to it. A rollback has to be visible from the surface that made the change.

**R8 — Drag to reorder**
- C17: Touch sensors should use a delay with a small tolerance (250 ms, 5 px) so a drag does not hijack scrolling. `touch-action` should be set on draggables. [S22, S23, S28]
- C18: dnd kit has built-in keyboard dragging and screen-reader announcements. The KeyboardSensor must be kept. [S25, S26, S27]
- C19: Maintenance and React 19 support:
  - `@dnd-kit/react` 0.5.0 is current but pre-1.0.
  - `@dnd-kit/core` 6.3.1 and `@dnd-kit/sortable` 10.0.0 are stable but have had no release since December 2024.
  - All of them accept React 19. [S29]
- C20: Motion Reorder documents no keyboard or screen-reader support. [S34] Pragmatic drag and drop is headless, so the touch and keyboard layer would have to be built by hand. [S32]
- Design consequence:
  - Use `@dnd-kit/core` + `@dnd-kit/sortable`, dragging from a handle.
  - Touch uses a 250 ms delay with a 5 px tolerance, plus `touch-action: manipulation` on the handle.
  - Keep the KeyboardSensor and the announcements.
  - Add Move up and Move down actions per row, sharing the reorder mutation, as the VoiceOver path.

## Unresolved

- No source covers WebKit service-worker overhead in an installed iOS 26 PWA. It needs measuring on the device.
- Serving stale `?_rsc=` payloads after a new build was not researched. The timeout fallback is used only when the network is slow, and a cache bump on each deploy limits the risk.
- Long-press behaviour of dnd kit on iOS standalone (the text-selection or callout menu) is unconfirmed. `-webkit-touch-callout: none` and `user-select: none` on the handle are an unverified mitigation, and need a device check.
- Gzip sizes of the drag libraries are unmeasured.
- TanStack callback signatures were not re-checked against 5.104.
