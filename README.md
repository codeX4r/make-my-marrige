# MakeMyMarrige

Production-oriented workspace foundation for the MakeMyMarrige web application, REST API, and background worker. This milestone contains operational infrastructure only; product domain modules are intentionally not implemented.

## Requirements

- Node.js 22.12 or newer in the Node 22 line
- pnpm 12.18.0
- Docker Compose for local MongoDB and Redis dependencies

## Local development

1. Copy `.env.example` to `.env` and keep local values out of source control.
2. Start MongoDB (single-node replica set) and Redis: `docker compose -f infrastructure/docker/docker-compose.yml up -d`.
3. Install: `pnpm install`.
4. Start web, API, and worker: `pnpm dev`.

The Next.js server listens on port 3000, the NestJS API on port 4000, and worker health on port 4001. The API business route prefix is `/v1`; operational health endpoints are `/health/live` and `/health/ready`. The browser communicates through the Next.js same-origin `/api/v1/*` BFF proxy, which forwards to NestJS `/v1/*`.

## Quality checks

Run `pnpm check` for formatting, linting, type checking, tests, and builds. Run `pnpm test:integration` with local dependencies running to exercise a MongoDB transaction and a BullMQ/Redis round trip.

## Configuration

The API and worker validate their environments during startup. The web process validates `API_BASE_URL` when the server-side BFF handles a request. `API_BASE_URL` is server-only and must point to the NestJS API. `BFF_UPSTREAM_TIMEOUT_MS` optionally configures the BFF timeout (100–30000 ms; default 5000 ms). API and worker logs redact common credential fields. No production provider, region, credentials, or deployment platform is selected here.

## Workspace layout

- `apps/web`: Next.js App Router shell, status page, and BFF boundary
- `apps/api`: NestJS REST foundation, MongoDB connection, operational health
- `apps/worker`: standalone NestJS worker foundation, Redis/BullMQ boundary, health
- `packages/config`, `packages/logger`, `packages/observability`: shared infrastructure utilities
- `infrastructure/docker`: local MongoDB replica set and Redis
- `tests/integration`: infrastructure smoke tests
