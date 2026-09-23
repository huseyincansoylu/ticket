# Progress

## Status

Milestone 1 in progress: TypeScript domain model drafted, Prisma schema next.

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
- Next: translate this into a Prisma schema for the booking-service's Postgres schema, with real
  constraints (`@@unique([eventId, seatId])` on both `EventSeat` and `Ticket`).

## Open questions

- Docker Compose still needs a live `docker compose up` smoke test (Docker daemon wasn't running
  when milestone 0 was set up).
- Which service's Postgres schema owns `Order`/`Ticket` — assumed booking-service for now (per
  architecture doc), payment-service only tracks `Payment` records referencing `orderId`.
