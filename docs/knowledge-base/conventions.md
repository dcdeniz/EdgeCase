# Conventions

- Prefer server components until interactivity needs a client component.
- Apply schema changes only through migrations; user data requires RLS scoped to `auth.uid()`.
- Update OpenAPI with Edge Functions. Browser variables use `NEXT_PUBLIC_`; admin secrets never do.
- Accepted ADRs are immutable; supersede them with a new ADR.
- Use NEAT queries/discovery for repository searches; do not use grep or ripgrep.
