# Progress

## Status

Milestone 0 scaffolding in place. Workspace installs and typechecks cleanly.

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

Milestone 1 — Domain and data model (event, venue, section, row, seat, hold, order, ticket).

## Open questions

- None blocking milestone 1. Docker Compose still needs a live `docker compose up` smoke test.
