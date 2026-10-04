# Research — web-api-client

```yaml
schema: gentle-ai.sdd-research/v1
revision: 1
outcome: done
accessed_at: 2026-10-03
```

## Questions

- **R1**: How does `NEXT_PUBLIC_API_URL` behave in this project's Docker build, and what does the Dockerfile need?
- **R2**: Which axios 1.x primitives cover the client: base URL, cookies, the 401 redirect, mapping status codes (409) to errors, and the adapter?
- **R3**: How should axios-based code be tested under strict TDD with Vitest?
- **R4**: How should TanStack Query v5 be set up in a Next.js 16 App Router app with no SSR prefetching?

## Admission

The research used web and documentation sources only (context7, web search, the npm registry). No credentials and no remote systems were involved.

## Sources

| id | class | title | publisher | URL | excerpt |
|---|---|---|---|---|---|
| S1 | official-docs | Self-hosting: Environment Variables | Vercel / Next.js | https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/self-hosting.mdx | "these public environment variables will be inlined into the JavaScript bundle during `next build`" |
| S2 | official-docs | Upgrading to v16 | Vercel / Next.js | https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/upgrading/version-16.mdx | "NEXT_PUBLIC_API_URL=\"/api\" … accessed inside a Client Component" |
| S3 | community | How to Configure Next.js with Docker | OneUptime | https://oneuptime.com/blog/post/2026-01-24-nextjs-docker-configuration/view | ARG declared, then ENV set, in the builder stage before `next build` |
| S4 | community | Self-hosted standalone build, env vars | Croct | https://croct.com/answers/nextjs-standalone-docker-croct-env.md | "by the time your container starts, the value is already frozen" |
| S5 | official-docs | axios README (v1.x) — instances, config | axios | https://github.com/axios/axios/blob/v1.x/README.md | `axios.create({ baseURL, timeout, headers })` |
| S6 | official-docs | Interceptors | axios | https://github.com/axios/axios/blob/v1.x/docs/pages/advanced/interceptors.md | "status codes that falls outside the range of 2xx cause this function to trigger" |
| S7 | official-docs | Fetch adapter | axios | https://github.com/axios/axios/blob/v1.x/docs/pages/advanced/fetch-adapter.md | `axios.create({ adapter: 'fetch' })` |
| S8 | official-docs | Testing | axios | https://axios.rest/pages/advanced/testing | module mocking, axios-mock-adapter, fresh instance per test |
| S9 | registry | axios-mock-adapter | npm | https://www.npmjs.com/package/axios-mock-adapter | v2.1.0, peer `axios >= 0.17.0`, last modified 2024-10-09 |
| S10 | official-docs | Advanced SSR (App Router providers) | TanStack | https://github.com/tanstack/query/blob/main/docs/framework/react/guides/advanced-ssr.md | `'use client'` providers file, browser singleton `QueryClient` |
| S11 | official-docs | queryOptions | TanStack | https://github.com/tanstack/query/blob/main/docs/framework/react/reference/functions/queryOptions.md | typed options shared across hooks and the client |
| S12 | official-docs | ESLint exhaustive-deps | TanStack | https://github.com/tanstack/query/blob/main/docs/eslint/exhaustive-deps.md | every `queryFn` dependency must be in the `queryKey` |
| S13 | registry | @tanstack/react-query, axios | npm | https://www.npmjs.com/package/@tanstack/react-query | react-query 5.104.1, peer `react ^18 \|\| ^19`; axios 1.20.0 |

## Validated claims

**R1 — Environment**
- C1: `NEXT_PUBLIC_*` values are inlined at `next build`, and the running container cannot change them. [S1, S4]
- C2: The variable has to be present in the build stage, which means `ARG NEXT_PUBLIC_API_URL` plus `ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL` before the `next build` step. In compose, it is supplied via `build.args`. [S3, S4]
- C3: Next 16 documents `NEXT_PUBLIC_API_URL` read inside a Client Component as a supported pattern. [S2]
- C4: The runtime alternative is `connection()`, which is what the project uses today and is what makes single-image promotion possible. Choosing `NEXT_PUBLIC_` gives that up. The owner accepted this on 2026-10-03. [S1]

**R2 — axios**
- C5: `axios.create({ baseURL })` returns an instance whose defaults apply to every request. Cookie-bearing cross-origin requests need `withCredentials: true` (the current gateways send `credentials: 'include'`). [S5]
- C6: A response interceptor's error branch runs for every non-2xx status. That makes it the place for the 401 → `/sign-in` redirect, which replaces `sessionAwareFetch`. [S6]
- C7: Because non-2xx statuses reject, any status-specific branch must catch and inspect `error.response?.status`. Examples are the 409 → `StalePreviewError` mapping and the sign-in 401 → `InvalidCredentialsError` mapping. [S6]
- C8: Axios ships a `fetch` adapter as an option. The default in browsers is XHR. Nothing here requires fetch, because the service worker does not use the client. [S7]

**R3 — Testing**
- C9: The documented options are `vi.mock` of the module, axios-mock-adapter, and a fresh instance per test, which avoids shared-state leaks. [S8]
- C10: axios-mock-adapter 2.1.0 declares a peer of `axios >= 0.17.0` but has not been published since 2024-10. [S9]

**R4 — TanStack Query**
- C11: The App Router setup is a `'use client'` providers component that holds a browser-singleton `QueryClient`, rendered from the root layout. [S10]
- C12: `queryOptions()` gives typed, reusable query definitions. Keys must include every `queryFn` input. [S11, S12]
- C13: v5 supports React 19. [S13]

## Contradictions and uncertainty

- **U1**: Search snippets report friction between axios-mock-adapter and axios ≥ 1.5. The library's own peer range claims compatibility, and it was not tested against 1.20 here. Lower-risk option: give the client factory an injectable `adapter` (an axios config option), so tests pass a stub adapter with no extra dependency. **UNVERIFIED** until the first red test runs.
- **U2**: S10 recommends against `useState` for the client when no Suspense boundary sits above it. This app does not use Suspense for data, so either form works. The module-level singleton follows S10.

## Freshness

All sources were accessed on 2026-10-03. Versions were pinned from npm on that date: axios 1.20.0, @tanstack/react-query 5.104.1.

## Product choices (non-authoritative, owner decides)

- **P1**: Test doubles. The options are a stub `adapter` injected through a client factory (no dependency, per U1), or axios-mock-adapter.
- **P2**: Default `staleTime`. S10 uses 60 s for SSR. With no SSR, the default of 0 plus refetch-on-focus also works.
