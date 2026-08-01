# ZappOS Operations

ZappOS is a TanStack Start application backed by Supabase. This repository uses npm's lockfile as the authoritative dependency graph.

## Supported toolchain

- **Node.js:** 22.22.2 (supported range `>=22.12.0 <23`)
- **npm:** 11.4.2 (supported range `>=11.4.2 <12`)

Both `.nvmrc` and `.node-version` declare the Node release. If you use `nvm`:

```bash
nvm install
nvm use
npm install --global npm@11.4.2
```

Do not install with Bun or regenerate `package-lock.json` using a different package manager. `bun.lock` is retained for historical tooling compatibility, but CI and deployment use npm.

## Clean installation

From a fresh clone:

```bash
npm ci
```

`npm ci` is intentionally required instead of `npm install`: it fails when `package.json` and `package-lock.json` drift and never rewrites the lockfile.
The repository enables npm's `engine-strict` check, so installation also fails early when the declared Node or npm runtime is not active.

## Environment

Create a local `.env` (ignored by Git) containing the public browser credentials for the intended non-production Supabase project:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Never place a Supabase service-role key, database password, provider secret, or production credential in a `VITE_*` variable: Vite exposes those values to browser code. Worker and database secrets belong in the deployment platform's server-side secret store.

For staging, set `ZAPPOS_ENV=staging` in the server/worker environment and use a dedicated Supabase project, storage, service identities, telemetry endpoint, and frontend deployment. Simulation seeding additionally requires `ZAPPOS_ENABLE_SIMULATION_SEED=true` and must never run in production.

## Development

```bash
npm run dev
```

The development server uses Vite/TanStack Start. The shared Lovable configuration in `vite.config.ts` already installs the React, Tailwind, TanStack Start, Nitro, and path-alias plugins; do not register duplicate plugins.

## Validation

Run the same checks used by CI:

```bash
npx tsc --noEmit
npm run lint
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
```

Focused simulation commands are also available:

```bash
npm run test:simulation
npm run test:simulation:roles
npm run test:simulation:security
npm run test:simulation:performance
npm run test:simulation:report
```

Playwright starts the application automatically and supplies local, non-secret placeholder Supabase values for public-route and protected-route tests. It runs desktop, tablet, and mobile Chromium projects. Installing the Chromium binary is a one-time prerequisite on each machine.

## Production build

```bash
npm run build
npm run preview
```

Before deployment, configure the correct public Supabase URL and publishable key in the frontend environment and keep all privileged secrets server-side. Verify direct navigation through the deployment host because the application uses TanStack Start routing and SSR rather than a static-only SPA fallback.

## Supabase prerequisites

Database migrations live in `supabase/migrations` and must be applied in filename order to a dedicated target. Do not skip earlier phases. After applying migrations, regenerate `src/integrations/supabase/types.ts` from that target with the Supabase CLI and review the diff rather than hand-editing generated types.

Never assume the project ID in `supabase/config.toml` is safe for destructive or simulation work. Positively identify the target as non-production before linking, migrating, resetting, or seeding it.

## Continuous integration

`.github/workflows/ci.yml` validates every pull request with a lockfile install, TypeScript, lint, unit tests, production build, and all Playwright browser projects. Each command is a separate fail-fast step so a failed engineering gate cannot be reported as deployment-ready.
