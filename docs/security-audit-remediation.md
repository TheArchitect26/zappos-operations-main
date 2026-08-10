# Security audit remediation notes

## RLS exception authority

The reviewed exception allowlist is defined in
`tests/staging/security-global-rls.sql`. It is intentionally empty as of this
pass: every current `public` base table is application data and must have RLS.
Any future exception must name one exact table (wildcards fail), state the
reason and expected exposure, identify the security authority, and declare
whether it contains tenant or user data.

## Authentication middleware decision

`src/integrations/supabase/auth-middleware.ts` exported
`requireSupabaseAuth`, but no route or server function imported it. The
application's authenticated route layout handles navigation gating and
Supabase RLS remains the data-security boundary. Wiring unused bearer-header
middleware into unrelated browser routes would introduce a second, inconsistent
authentication path, so the dead middleware was removed.

## React hook review

The seven audited data hooks used locally recreated `fetch` functions while
their effects listed only selected values. That created stale-filter risk (most
notably search terms) and made the intended refetch boundary implicit. Each
function is now memoized with its actual company, user, and filter inputs, and
each effect depends on that memoized function. No shared abstraction was added:
the fetch bodies and mutation APIs differ enough that consolidation would add
indirection without reducing security or lifecycle risk.

## Repository housekeeping

The empty root `now` file had no references and was removed. npm remains the
authoritative package manager. `bun.lock` is retained because the README
explicitly records historical tooling compatibility; CI and deployment do not
consume it.

## Recharts 3.x technical debt

The application currently imports Recharts only through
`src/components/ui/chart.tsx`, a shared wrapper used by dashboard chart
consumers. The dependency remains pinned to the compatible 2.15 line for this
security-only pass. A separate upgrade should validate wrapper typings,
responsive container sizing, tooltip/legend payload shapes, accessibility
defaults, CSS selectors targeting Recharts internals, SSR rendering, and all
dashboard visual regressions. The central wrapper limits code migration surface,
but visual and TypeScript behavior make this a moderate-risk major upgrade that
should not be bundled into an RLS remediation.
