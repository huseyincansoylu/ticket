# Progress

## Status

Milestone 1 in progress: domain model drafted and translated to a Prisma schema.
Not yet migrated against a live Postgres (Docker daemon not running locally).

## Completed milestones

### Milestone 0 — Monorepo setup, tooling, Docker Compose skeleton

- pnpm workspaces (`apps/*`, `services/*`, `packages/*`) + Turborepo for task orchestration —
  see [ADR 0001](./adr/0001-monorepo-tooling.md).
- Placeholder packages for `apps/web`, `services/{api-gateway,booking-service,payment-service,
  notification-service}`, and `packages/shared-types` — each just typechecks a stub for now.
- `docker-compose.yml` with Postgres 16, Redis 7, RabbitMQ 3 (management UI on :15672).
- `pnpm install` and `pnpm typecheck` verified working across all 6 packages.
- `docker compose config` validated; **not** yet verified running end-to-end (Docker daemon was
  not running locally when this was set up — needs a real check next session).

## Current step

Milestone 1 — Domain and data model.

- Done: TypeScript domain model drafted in `packages/shared-types/src/index.ts` — `Venue`,
  `Section`, `Row`, `Seat` (physical inventory), `Event`, `EventSeat` (per-event seat status),
  `Order`, `Ticket`, and the Redis-backed `Hold` type (no `id` — composite key is the identity).
- Done: `services/booking-service/prisma/schema.prisma` — full translation of the domain model
  into Prisma models, all in the `booking` Postgres schema (Prisma 7's `schemas` multi-schema
  support, now GA — no `previewFeatures` flag needed). `@@unique([eventId, seatId])` on both
  `EventSeat` and `Ticket`. `prisma validate` and `prisma generate` both pass.
- Next: get Postgres running (`docker compose up -d`) and run `db:migrate` for real — not yet
  verified against a live database. Then move to milestone 2 (booking service seat holds).

## Open questions

- Docker Compose still needs a live `docker compose up` smoke test, and the Prisma schema still
  needs a live `prisma migrate dev` run — Docker daemon wasn't running locally in this session.
- Which service's Postgres schema owns `Order`/`Ticket` — assumed booking-service for now (per
  architecture doc), payment-service only tracks `Payment` records referencing `orderId`.
