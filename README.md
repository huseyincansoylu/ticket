# Ticket

An event ticketing system built to handle a high-demand "on-sale" moment: thousands of users
competing for a limited number of seats, with zero double bookings.

This is a portfolio project. See [`CLAUDE.md`](./CLAUDE.md) for the full problem statement,
architecture, and roadmap, and [`docs/PROGRESS.md`](./docs/PROGRESS.md) for current status.

## Status

Early scaffolding (milestone 0). Not runnable yet.

## Repo layout

```
apps/web                     Next.js frontend (seat map UI)
services/api-gateway         Auth, rate limiting, routing
services/booking-service     Seat holds, expirations, confirmations
services/payment-service     Stripe integration, webhooks
services/notification-service Email + realtime fan-out
packages/shared-types        Domain types shared across services
docs/adr                     Architectural decision records
docs/PROGRESS.md             Milestone tracking
```

## Tooling

- Package manager: pnpm (workspaces)
- Task orchestration: Turborepo
- Node.js: 22 LTS (see `.nvmrc`)
- Local infra: Docker Compose (Postgres, Redis, RabbitMQ)

## Getting started

```bash
nvm use
pnpm install
docker compose up -d
```
