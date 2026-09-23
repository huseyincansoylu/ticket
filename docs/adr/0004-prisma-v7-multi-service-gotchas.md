# 4. Prisma 7 gotchas for multiple services sharing one Postgres instance

## Status

Accepted

## Context

Setting up Prisma for `payment-service` (milestone 4) surfaced three Prisma 7-specific issues not
hit when `booking-service` was set up in milestone 1, because `booking-service` had never actually
imported its generated client in application code until now.

### 1. `_prisma_migrations` lives in `public` by default, regardless of the `schemas` array

Both `booking-service` and `payment-service` connect to the same physical Postgres database
(`ticket`, on host port 5433), each scoped to its own schema (`booking`, `payment`) via the
`schemas` array — this was always the plan (schema-per-service, one shared instance for
operational simplicity). What wasn't obvious: Prisma's migration-tracking table
(`_prisma_migrations`) is created in the **`public`** schema by default, independent of whatever
`schemas` are listed in the datasource. Running `prisma migrate dev` for `payment-service` against
the same database immediately conflicted with `booking-service`'s migration history already
recorded in `public._prisma_migrations` — Prisma reported `booking-service`'s migration as
"missing from local migrations directory" from `payment-service`'s point of view, and offered to
`migrate reset` (**destructive** — would have dropped data; not run).

Fix: append `?schema=<service-schema>` to each service's `DATABASE_URL` (e.g.
`...?schema=payment`). This sets Postgres's `search_path` for that connection, which Prisma
respects when creating `_prisma_migrations` — each service now gets its own migrations table
inside its own schema, fully isolated.

`booking-service`'s `DATABASE_URL` was **not** retroactively changed — it already has a working
migration history in `public._prisma_migrations`, and touching it risked confusing an
already-applied migration's tracking state for no benefit. Every service *after* payment-service
must include `?schema=<name>` in its `DATABASE_URL` from the start.

### 2. Generated client output must live under the service's `rootDir` (inside `src/`)

Prisma 7's `prisma-client` generator emits real `.ts` source files (not a pre-built package with
`.d.ts` + compiled `.js`, like the old `prisma-client-js` generator). `tsc` therefore needs to
compile the generated output as part of the program. Initially the output was placed as a sibling
of `src/` (`../generated/prisma`, i.e. `services/<name>/generated/prisma`) for the same reason as
booking-service's earlier setup — "don't mix generated code with hand-written code." That breaks
as soon as anything actually imports from it: `tsconfig.json`'s `rootDir: "src"` requires every
compiled file to live under `src`, and a file outside it fails with `TS6059`.

Fix: output to `../src/generated/prisma` (i.e. `services/<name>/src/generated/prisma`) — Prisma's
own official examples use this exact path. `src/generated/` is gitignored.

### 3. `PrismaClient` now requires an explicit driver adapter for Postgres

Older Prisma versions let `new PrismaClient()` read `DATABASE_URL` implicitly. Prisma 7 requires
passing a driver adapter explicitly:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

`prisma.config.ts`'s `datasource.url` is a CLI-only concern (used by `migrate`/`generate`/`studio`);
it is not read by the generated client at runtime.

## Decision

For every future service with its own Postgres schema:

1. `DATABASE_URL` includes `?schema=<service-schema>`.
2. Prisma client generator output is `../src/generated/prisma` (inside `src/`, gitignored).
3. The Prisma client is constructed with an explicit `@prisma/adapter-pg` `PrismaPg` adapter.

## Consequences

- `booking-service`'s `DATABASE_URL` remains without `?schema=booking` for now (its migrations
  table stays in `public`) — asymmetric with `payment-service`, but changing it retroactively is
  riskier than leaving it. If `booking-service` grows a Prisma-backed persistence layer (it
  currently doesn't use its generated client anywhere), revisit adding `?schema=booking` in
  isolation, verifying the existing `public._prisma_migrations` row for it is handled correctly
  first.
- Any third service must follow the `?schema=` convention from the start to avoid the same
  collision.
