# Progress

## Status

Milestone 3 complete: automated test proves zero double booking under real concurrency.

## Completed milestones

### Milestone 0 — Monorepo setup, tooling, Docker Compose skeleton

- pnpm workspaces (`apps/*`, `services/*`, `packages/*`) + Turborepo for task orchestration —
  see [ADR 0001](./adr/0001-monorepo-tooling.md).
- Placeholder packages for `apps/web`, `services/{api-gateway,booking-service,payment-service,
  notification-service}`, and `packages/shared-types` — each just typechecks a stub for now.
- `docker-compose.yml` with Postgres 16, Redis 7, RabbitMQ 3 (management UI on :15672).
- `pnpm install` and `pnpm typecheck` verified working across all 6 packages.
- `docker compose up -d` verified end-to-end (see milestone 1 below for the port fix needed).

### Milestone 1 — Domain and data model

- TypeScript domain model drafted in `packages/shared-types/src/index.ts` — `Venue`, `Section`,
  `Row`, `Seat` (physical inventory), `Event`, `EventSeat` (per-event seat status), `Order`,
  `Ticket`, and the Redis-backed `Hold` type (no `id` — composite key is the identity).
- `services/booking-service/prisma/schema.prisma` — full translation into Prisma models, all in
  the `booking` Postgres schema (Prisma 7's `schemas` multi-schema support, GA, no
  `previewFeatures` flag needed). `@@unique([eventId, seatId])` on both `EventSeat` and `Ticket`.
- Found & fixed a port conflict: a native Postgres process (unrelated to this project) was
  already listening on `127.0.0.1:5432` / `[::1]:5432` on this machine, so `docker-compose.yml`
  now maps Postgres to host port **5433** instead of 5432. `DATABASE_URL` in
  `services/booking-service/.env(.example)` and root `.env.example` updated accordingly.
- `prisma migrate dev --name init` run successfully against live Postgres — 8 tables created in
  the `booking` schema, verified via `psql`: `Ticket_eventId_seatId_key` and
  `EventSeat_eventId_seatId_key` UNIQUE constraints both present, all foreign keys in place.

### Milestone 2 — Booking service: seat holds and expiration with Redis

- NestJS chosen as the HTTP framework for all backend services (over Fastify/Express).
- `RedisModule` (ioredis client provider), `HoldsModule`/`HoldsController`
  (`POST`/`DELETE`/`GET` on `/events/:eventId/seats/:seatId/hold`), `AppModule`, `main.ts`.
- Switched booking-service from a hand-rolled `tsx` dev loop to the official `@nestjs/cli`
  (CommonJS, not ESM) — `tsx`/esbuild does not support `emitDecoratorMetadata`, which broke
  NestJS's constructor-based dependency injection (`this.holds` was `undefined` in the
  controller). `nest build`/`nest start --watch` use the real `tsc`, so DI works correctly.
  Worth an ADR: this project now has two module systems (ESM for `shared-types`, CommonJS for
  NestJS services) — deliberate, not an oversight.
- `HoldsService` implemented by hand: `acquireHold` (`SET key value EX 600 NX`), `releaseHold`
  (atomic Lua compare-and-delete — `GET` + compare `userId` + `DEL` in one script, since a plain
  `DEL` could delete a different user's hold if the TTL expired and someone else grabbed the seat
  in between), `getHold` (`GET` + `PTTL` to compute `expiresAt`).
- Verified live via a Postman collection (`services/booking-service/postman-collection.json`):
  acquire → 201, acquire again (same seat) → 409 Conflict, release (wrong user) → 404, release
  (right user) → released: true, re-acquire after release → 201, get → correct hold with
  `expiresAt`.

### Milestone 3 — Concurrency tests proving zero double booking

- Jest + ts-jest wired up for booking-service (`pnpm test`). Pinned all `@nestjs/*` packages to
  `^11` instead of `^12` — `@nestjs/common@12` ships as ESM-only (`"type": "module"`), which
  Jest's CommonJS test runner cannot `require()`, even with `transformIgnorePatterns` fixed for
  pnpm's nested `.pnpm/` store layout and a `babel-jest` transform added specifically for it. `^11`
  is still CommonJS and sidesteps the whole problem. See the update at the bottom of
  [ADR 0002](./adr/0002-nestjs-services-use-commonjs.md).
- `holds.service.concurrency.spec.ts`: fires 50 concurrent `acquireHold` calls (different
  `userId`s) at the same `eventId`/`seatId` via `Promise.all`, against a real Redis instance (not
  mocked). Asserts exactly 1 resolves `true`. Passes — `SET NX EX`'s atomicity guarantee is now
  proven by an automated, repeatable test, not just manual Postman checks.

## Current step

Milestone 4 — Payment service: Stripe test mode, webhooks, idempotency.

## Open questions

- Which service's Postgres schema owns `Order`/`Ticket` — assumed booking-service for now (per
  architecture doc), payment-service only tracks `Payment` records referencing `orderId`.
- Reminder: Postgres is on host port **5433**, not 5432; booking-service is on **4001**, not the
  NestJS default 3001 — both because of pre-existing unrelated local processes on this machine.
- Redis has no password in `docker-compose.yml` (unlike Postgres/RabbitMQ) — flagged, not yet
  fixed. Low risk locally, must fix before any real deployment.
- `api-gateway` is still an unbuilt placeholder. Clarified with the user: the CLAUDE.md "no more
  than three backend services" non-goal refers to the three domain services (booking, payment,
  notification) — the gateway is an edge/routing layer, not counted against that limit.
- Deployment (milestone 11) direction discussed but not decided: single VPS + docker-compose
  (paid, ~$5-6/mo, e.g. Hetzner/DigitalOcean) vs. Oracle Cloud Always Free VM (same approach, free,
  but free-tier signup has more friction) vs. Railway (usage-based billing, likely exceeds the
  free/hobby credit for our ~8-service stack, and docker-compose doesn't import 1:1).
