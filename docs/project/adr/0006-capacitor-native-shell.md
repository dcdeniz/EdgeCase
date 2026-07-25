# ADR 0006: Ship native apps with Capacitor rather than rewriting in React Native

- Status: Accepted
- Date: 2026-07-25

## Context

PreSeed needs iOS and Android builds. The existing product is a Next.js App Router
web app whose entire interface is the mobile design system described in
[ADR 0003](0003-mobile-design-system.md).

That design system is built on web platform primitives, and the choice of native
strategy is really a question about those primitives:

- The token layer is CSS custom properties bridged through Tailwind, repainted at
  runtime by `data-theme`, `data-text-scale`, `data-motion` and `data-contrast`.
- Theme, contrast and motion preferences are `@media (prefers-color-scheme)`,
  `prefers-contrast` and `prefers-reduced-motion`.
- Every sheet is a native `<dialog>` opened with `showModal()`, which is what
  supplies focus containment, background inertness and Escape handling. There is no
  focus-trap code to port because the platform provides it.
- Form validation is `:user-invalid`, so errors appear only after a value is
  committed.
- Text scaling multiplies the root font size and every size is `rem`.
- Charts are inline SVG. Safe areas are `env(safe-area-inset-*)` and `dvh`.

A React Native port via Expo would re-derive all of that: the theming layer, the
accessibility layer and the chart layer, which are the three parts carrying the
WCAG 2.2 AA claims. Expo is the correct choice when starting mobile-first. PreSeed
is not starting mobile-first.

The counter-argument is native integration. Wearables — Apple Health, Health
Connect, Oura, Whoop, Garmin — are Phase 2 of the roadmap, and React Native's health
ecosystem is more mature. Capacitor has plugins for both platforms' health APIs, and
this need is not immediate.

## Decision

Ship native builds with Capacitor, wrapping a static export of the existing
application. Do not rewrite the interface.

The web deployment is unchanged. A second build target produces the native bundle:

- `next.config.ts` applies `output: "export"`, `trailingSlash` and unoptimised images
  only when `BUILD_TARGET=native`. The default path — Vercel — keeps server
  rendering, route handlers and image optimisation.
- `scripts/native-build.mjs` wraps the export. It moves `src/app/api` outside the app
  directory for the duration of the build, because `/api/health` is deliberately
  `force-dynamic` and a liveness probe with a cached timestamp is worthless. The move
  is idempotent and restores on failure.
- The three dynamic segments export `generateStaticParams` from a pass-through server
  layout, because their pages are client components and cannot export it themselves.
  All three sets are closed: evidence IDs, marker codes, reasoning chain IDs.
- `src/app/manifest.ts` is marked `force-static`, which is correct for both targets.

Supabase Edge Functions are reached over HTTPS from the WebView exactly as from the
browser, so no backend contract changes.

Revisit this decision when wearable integration becomes real work, not before. Expo's
`'use dom'` directive renders React web components inside a native Expo app per
component, which makes a later migration incremental rather than a rewrite — the
reasoning chain and charts could stay as DOM components while high-traffic list
screens move to native views.

## Consequences

The team ships to both stores without maintaining a second interface implementation,
and the accessibility work, token layer and chart layer keep working unmodified. One
codebase, one design system, one set of screens.

The cost is a WebView. Scroll and animation on older Android devices will be behind
native, though this application's motion budget is deliberately small — opacity and
an 8px translate, with one staggered reveal — so the gap is narrower here than for an
animation-heavy product.

Two operational consequences follow. Running the default `next build` deletes `out/`,
so `native:sync`, `native:ios` and `native:android` all rebuild first rather than
assuming a current bundle. And ESLint must ignore `ios/**` and `android/**`, which
contain generated scaffolding and a copy of the built bundle.

App Store review is a known risk. A WebView wrapper with no native integration is the
profile Apple scrutinises under guideline 4.2, and health-adjacent apps attract
additional review. Ship at least one genuine native capability before submitting, and
keep the research-prototype framing explicit. TestFlight avoids this entirely for
demonstrations.
