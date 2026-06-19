# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Vigie Citoyenne (Poitiers) — a civic transparency site that ingests open data (municipal deliberations,
budget/finance indicators) and exposes it through a Go API and a React SPA.

- `backend/` — Go API server, migrations, and data ingester (module `github.com/geo1796/vigie-citoyenne-poitiers`)
- `frontend/web/` — React + TanStack Router/Query SPA, built with Vite, served by the Go binary in production
- `database/` — Postgres Docker image + `schema.sql` (extensions, schemas, triggers not managed by goose)

## Commands

### Backend (run from `backend/`)

```
go build ./...                 # compile everything
go vet ./...                   # static checks
go test ./...                  # run all tests
go test ./features/common/async/...   # run a single package's tests
gofmt -l .                      # list files needing formatting (gofmt -w . to fix)
```

CLI subcommands on the built binary (`go run ./server <cmd>` or the built `vigie` binary):
- `vigie` — start the HTTP server (default, no args)
- `vigie migrate <up|down|status|version|redo|reset>` — goose migrations against `postgres/migrations`
- `vigie ingest <deliberations|deliberations documents|indicateurs>` — run a one-off ingestion job

Config is loaded from environment variables (see `backend/config/*.go`); local dev uses `.backend.env` /
`.database.env` at the repo root. `ACTIVE_PROFILE=prod` switches logging level and enforces stricter config
loading (e.g. token secrets) — default profile is `test`.

### Frontend (run from `frontend/web/`)

```
pnpm install
pnpm dev                       # vite dev server, proxies /api -> http://localhost:8080
pnpm build                     # tsc -b && vite build
pnpm lint                      # biome lint .
pnpm format                    # biome format --write .
pnpm check                     # biome check --write .   (lint + format, fixes in place)
```

There is no JS test runner configured yet.

### Full stack (Docker Compose, run from repo root)

```
docker compose up              # database + app + one-shot migrate job
```
`docker-compose.yml` defines three services: `database` (Postgres, healthchecked), `app` (the API server,
built from the root `Dockerfile`, which also embeds the built frontend via `embed.FS` into
`backend/server/spa/dist`), and `job` (built from `Dockerfile.jobs`, used for one-off `migrate`/`ingest`
invocations — this is also what scheduled ingestion jobs run in production).

## Backend architecture

Feature-folder layout under `backend/features/<name>/`, each typically containing `router.go`, `handler.go`,
`service.go`, `model.go`. Features: `auth`, `deliberation`, `indicateur`, `ingester`, plus `common/` for
cross-cutting helpers (`httpx`, `async`, `mailer`, `validatorx`).

- **Wiring**: `server/main.go` constructs all dependencies (DB pool, store, token managers, mailer, async
  runner) and passes them down. `server/api/router.go` mounts each feature's `Router(...)` under `/api/v1`.
  Sub-commands (`migrate`, `ingest`) are dispatched in `main()` before the HTTP server is built — see
  `server/migrate.go` and `server/ingest.go`.
- **HTTP handlers**: routes are plain `http.HandlerFunc`s wrapped with `httpx.Adapt`, which lets handlers
  return an `error` (panics are recovered by chi's `middleware.Recoverer`). Return `httpx.NewError(status, msg)`
  for client-visible errors; anything else maps to a 500. Use `httpx.JSON(w, status, payload)` to write
  responses.
- **Data access**: sqlc generates `postgres/dao` from `postgres/queries/*.sql` against the schema in
  `postgres/migrations/` (config in `backend/sqlc.yaml`). `postgres.Store` wraps `*dao.Queries` and adds
  `ExecTx` for transactional multi-statement operations (see `postgres/store.go`). Handlers/services take
  `*dao.Queries` (or the full `Store` when they need transactions, like `auth`).
- **Auth**: cookie-based (`access` cookie holds a signed JWT). `auth.UseAuthenticate` middleware parses it
  into an `AuthedUser` stored in request context (key `"authedUser"`); `auth.UseRequireRole` gates routes by
  role. Refresh tokens are opaque tokens stored server-side (`refresh_tokens` table) so they can be revoked;
  see `features/auth/{jwt_manager,opaque_token_issuer,refresh_token_issuer}.go`. Password reset and account
  registration both use single-use, expiring tokens issued the same way.
- **Ingester** (`features/ingester/`): pulls deliberations from a "Webdelib" source and indicators/finance
  data from a "data.gouv.fr"-style "Datafair" API (`webdelib.go`, `datafair.go`), normalizes them, and
  upserts into Postgres. Designed to run as a scheduled batch job (`vigie ingest ...`), not inline with
  request handling.
- **Async work off the request path** (e.g. revoking sessions on logout) goes through `async.Runner`
  (`features/common/async/`), which has a real goroutine-based implementation and an inline (synchronous)
  implementation for tests.
- Migrations are goose SQL files in `postgres/migrations/`, embedded via `postgres/migrations/embed.go` and
  run with the `migrate` subcommand. `database/schema.sql` holds one-time Postgres setup (extensions, the
  `app` schema, the shared `set_updated_at()` trigger function) applied when the Postgres image builds —
  it is not a goose migration.

## Frontend architecture

Feature-folder layout under `src/features/<name>/` (`api.ts` + `model.ts` + `components/`), mirroring the
backend's feature split (`auth`, `deliberations`, `indicateurs`, `contributeur`). Routing is file-based via
TanStack Router (`src/routes/`, code-split automatically, generated route tree in `routeTree.gen.ts` — do not
hand-edit that file). Data fetching goes through TanStack Query backed by the shared `ky` client in
`src/api.ts`.

- The `ky` client (`src/api.ts`) is prefixed with `/api/v1` and sends cookies (`credentials: "include"`).
  Its `afterResponse` hook auto-recovers from a `401` by calling `auth/refresh` once (single-flight —
  concurrent 401s share one in-flight refresh) and replaying the original request; `auth/login` and
  `auth/refresh` themselves are excluded from this to avoid recursion. This hook is skipped in test mode.
- In dev, Vite proxies `/api` to `http://localhost:8080` (`vite.config.ts`) so the SPA and Go API run as
  separate processes locally; in production the built SPA is embedded into the Go binary and served from
  the same origin, so there is no CORS layer.
- UI primitives live in `src/shadcn/components/ui/` (shadcn/ui, Base UI under the hood) — extend these
  rather than introducing a second component library.
- Biome (not ESLint/Prettier) is the linter/formatter for the whole frontend; config is in `biome.json`.

## Conventions worth knowing

- Code comments and some identifiers in the backend are in French (domain terms like `delib_*`, `coll_*`
  match the upstream SCDL/data.gouv.fr schema field names) — keep French domain terminology when touching
  ingestion/data-model code rather than translating it.
- `gofmt -l .` currently reports some unformatted files outside of newly-touched code; don't let that block
  unrelated changes, but run `gofmt` on any file you edit.
