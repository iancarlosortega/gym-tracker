# Research — gym-tracker-mvp

**Date**: 2026-09-19
**Lanes selected**: R1–R5 (all five; completion mandatory before proposal)
**Method**: web search against current sources. Every claim below carries a source. Anything not sourced is marked UNVERIFIED and must not be treated as settled.

---

## R1 — iOS PWA capability (iPhone 16 Pro Max, current iOS)

**Verdict: a PWA is viable on iOS, with real and specific limits.**

| Capability | Finding | Source |
|---|---|---|
| Home-screen install | On iOS 26, any site added to the Home Screen opens as a full web app by default rather than returning to a Safari tab. | MobiLoud, slashifytech |
| Install prompt | **None.** iOS has no `beforeinstallprompt`. The user must use Share → Add to Home Screen manually. Onboarding must teach this. | MobiLoud, deepclick |
| Service worker offline | Works for caching assets and data for offline use. | MobiLoud |
| Storage | Cache API quota reported capped around **50 MB per partition**, and Safari may **evict** data after a period of disuse (7-day script-writable storage cap). | magicbell, MobiLoud |
| Push notifications | Supported since iOS 16.4 (Mar 2023) **only when the PWA is installed to the Home Screen** — an open browser tab does not qualify. Safari 18.4 added Declarative Web Push, which does not require a service worker. | MobiLoud, magicbell |
| Background sync | **Not available.** iOS heavily restricts background execution; periodic background sync is unsupported/unreliable. Service workers on iOS serve caching and push, not general background work. | magicbell, vinova |
| Engine | All iOS browsers use WebKit, so these limits are not escapable by using Chrome on iOS. | magicbell |

**Implication:** offline-capable logging is feasible, but storage is small and evictable — queued offline sets must sync promptly and must not be treated as durable long-term storage.

---

## R2 — Rest-timer delivery on iOS (the highest-risk lane)

**Verdict: a pocketed/locked 3-minute alert is achievable ONLY via server-sent Web Push. There is no client-side scheduled-notification path.**

Findings:

1. **Scheduled local notifications do not exist on the web.** There is no scheduled-notification capability in the Notifications API standard. The recommended substitute is a Web Push delivered *at the moment of the event*. — magicbell
2. **Web Push does arrive when the web app is not running**, provided the PWA is installed to the Home Screen. — magicbell
3. **Background timers in the page are unreliable.** iOS suspends background execution; a `setTimeout` in a backgrounded or locked PWA cannot be relied on to fire. — magicbell, vinova
4. **Push subscription durability is a reported problem.** Developers report subscriptions going inactive after 1–2 weeks of inactivity, requiring PWA reinstall to resubscribe. Reports are mixed on whether this is fully resolved. — Apple Developer Forums (threads 786360, 769794)
5. **Screen Wake Lock is supported** on iOS Safari from 16.4, and the long-standing bug that broke it *inside installed PWAs* was fixed in **iOS 18.4**. The lock releases automatically if the user navigates away or minimises. — web.dev, lambdatest, MDN

**Consequence — two distinct timer products:**

- **Screen-on timer (low risk):** phone propped up, app foregrounded, Wake Lock held, on-screen countdown plus audio. Works today, no server involvement.
- **Pocketed timer (medium risk):** backend schedules and sends a Web Push at T+rest. Requires the PWA to be installed, a push subscription, a server-side scheduler, and tolerance for subscription expiry. Feasible, not free, and carries a known reliability caveat.

---

## R3 — Cheap hosting for a long-running NestJS service

| Platform | Finding | Source |
|---|---|---|
| Render free | No credit card required; 750 instance-hours/month. **Spins down after 15 minutes idle and takes ~1 minute to cold-start.** | dev.to, nodejs.tech |
| Render paid | Entry-level instances from ~$7/mo. | ExpressTech |
| Railway | **No free tier**; per-second metering on top of a small plan fee. A 24/7 small Node app lands around **$5–7/mo**. Frequently recommended as the best solo-dev starting point. | dev.to, devtoolpicks |
| Fly.io | Cheapest always-on shared VM at **~$1.94/mo**; free tier is gone. Realistic small-app total quoted at **$8–25/mo** once egress and restarts are included. | dev.to, ExpressTech |

**The decisive fact for this app:** Render's free tier cold-starts for about a minute. Standing at a rack waiting 60 seconds to log a set is a product failure, not an inconvenience. Free-with-sleep is the wrong trade for gym-floor use unless the frontend absorbs it via offline-first logging.

---

## R4 — Cheap managed Postgres

| Provider | Free tier | Idle behaviour | Source |
|---|---|---|---|
| **Neon** | Up to 100 projects, 0.5 GB storage/project, 100 compute-hours/project per month, no credit card. | Scales to zero after ~5 min idle; **~500 ms** resume. Idle costs nothing. | Neon docs, buildmvpfast |
| **Supabase** | Free tier exists; max two active free projects per org. | **Pauses projects after 7 days of inactivity**, with ~10–30 s resume. Paid plans are always-on with no cold start. | designrevision, pkgpulse |
| **Turso** | 100 databases, 5 GB storage, 500M row reads/month. | Scale-to-zero deprecated for new users (Jan 2025) — new signups get always-on instances; no cold starts but no idle savings. SQLite, not Postgres. | devtoolpicks, techsy |

**Assessment:** Neon's ~500 ms resume is acceptable for this workload; Supabase's 7-day free-tier pause is actively hostile to a personal app used a few times a week, unless paid.

---

## R5 — Next.js current version

- Latest published: **16.3.5** (published ~6 days before 2026-09-19). — npm
- 2026 saw a formalised security-release cadence; August 25 2026 shipped 16.3.3 and 15.5.24 addressing two critical-severity vulnerabilities, and earlier patches covered middleware bypass, DoS, SSRF, cache poisoning and XSS. — Vercel changelog

**Implication:** pin an exact version and treat security patching as routine, not optional. The 16.x line is current.

---

## Confidence and gaps

- R1, R3, R4, R5 — **sourced, good confidence.** Pricing and free tiers change; re-verify before committing money.
- R2 — **sourced, but the push-subscription-durability question remains partly open.** Reports conflict on whether expiry after inactivity is fully fixed. Treat pocketed-timer reliability as a risk to validate with a real device test, not a settled capability.
- Not researched: iOS Live Activities for web apps (assumed unavailable, **UNVERIFIED**); exact Neon compute-hour consumption at this workload (**UNVERIFIED**).

## Sources

- https://www.mobiloud.com/blog/progressive-web-apps-ios/
- https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- https://slashifytech.com/blogs/progressive-web-apps-ios-2026
- https://deepclick.com/resources/blog/progressive-web-apps-on-ios/
- https://vinova.sg/navigating-safari-ios-pwa-limitations/
- https://developer.apple.com/forums/thread/786360
- https://developer.apple.com/forums/thread/769794
- https://web.dev/blog/screen-wake-lock-supported-in-all-browsers
- https://www.lambdatest.com/web-technologies/wake-lock-safari
- https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- https://dev.to/pavel-hostim/render-vs-railway-vs-flyio-pricing-compared-2026-2e5p
- https://nodejs.tech/posts/render-vs-railway-vs-flyio-nodejs-saas-hosting/
- https://expresstech.io/render-vs-railway-vs-fly-io-2026-pricing-showdown/
- https://devtoolpicks.com/blog/railway-vs-render-vs-fly-io-solo-developers-2026
- https://www.buildmvpfast.com/blog/neon-vs-supabase-vs-turso-serverless-postgres-mvp-2026
- https://designrevision.com/blog/supabase-vs-neon
- https://www.pkgpulse.com/guides/neon-vs-supabase-vs-turso-2026
- https://www.npmjs.com/package/next?activeTab=versions
- https://vercel.com/changelog/next-js-may-2026-security-release
