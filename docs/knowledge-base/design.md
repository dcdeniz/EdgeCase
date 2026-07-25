# Design

PreSeed is a mobile-first responsive web app. The implemented design system lives in `src/app/globals.css` (tokens), `src/components/` (components) and `src/app/` (screens); the specification is canonical in [`docs/design/`](../design/README.md).

Four outputs stay separate and never merge into one score: measured clinical profile, modifiable readiness, named screening risks, data confidence. Missing data lowers confidence, never readiness. Clinical gates render above every score and are not point deductions. Simulated data is labelled wherever it appears, and any capability without a contract renders a named pending-integration state rather than a plausible-looking result. Colour is never the sole carrier of meaning, and the approved status vocabulary replaces judgement language. See [ADR 0003](../project/adr/0003-mobile-design-system.md).
