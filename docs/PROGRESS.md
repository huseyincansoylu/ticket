# Progress

## Status

Milestone 1 complete: domain model, Prisma schema, and a real migration against Postgres.

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

## Current step

Milestone 2 — Booking service: seat holds and expiration with Redis.

- Done: NestJS chosen as the HTTP framework for all backend services. Boilerplate wired up for
  booking-service — `RedisModule` (ioredis client provider), `HoldsModule`/`HoldsController`
  (`POST`/`DELETE`/`GET` on `/events/:eventId/seats/:seatId/hold`), `AppModule`, `main.ts`.
  Boots cleanly (`pnpm --filter @ticket/booking-service dev`), routes verified reachable.
- Not done yet: `HoldsService` (`src/holds/holds.service.ts`) — `acquireHold`, `releaseHold`,
  `getHold` are stubbed (`throw new Error("not implemented")`). This is the actual business
  logic (SET NX EX for acquire, atomic Lua compare-and-delete for release) — intentionally left
  for hands-on implementation rather than scaffolded.

## Open questions

- Which service's Postgres schema owns `Order`/`Ticket` — assumed booking-service for now (per
  architecture doc), payment-service only tracks `Payment` records referencing `orderId`.
- Reminder: Postgres is on host port **5433**, not 5432 (pre-existing native Postgres process on
  this machine). booking-service also moved off its default port 3001 to **4001** for the same
  reason (an unrelated local Node process was already on 3001).
