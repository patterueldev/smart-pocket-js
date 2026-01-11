# Smart Pocket JS – Agent Operating Guide

A concise, link-first guide for automation agents working in this repo. Follow these rules and use the linked docs as the single sources of truth.

## Quick Start for Agents
- Respect workflow: no auto-commit; branch + PR only. See [.github/copilot-instructions.md](.github/copilot-instructions.md) and [docs/TASK_MANAGEMENT.md](docs/TASK_MANAGEMENT.md).
- Use pnpm everywhere; avoid npm/npx/expo direct. See [.github/copilot-instructions.md](.github/copilot-instructions.md).
- Keep changes minimal; show diffs before committing. See [.github/copilot-instructions.md](.github/copilot-instructions.md).
- Sync versions (root `version` + `buildNumber`, mobile `BUILD_NUMBER`, server `version`) before release. See [package.json](package.json), [apps/mobile/app.config.js](apps/mobile/app.config.js), [apps/server/package.json](apps/server/package.json), and [docs/RELEASE_PIPELINE_SETUP.md](docs/RELEASE_PIPELINE_SETUP.md).
- Generate API client via Orval after spec changes. See [orval.config.ts](orval.config.ts), [docs/api-spec.yaml](docs/api-spec.yaml).
- Use Docker scripts for dev/prod/test; validate with test scripts. See [docs/DEVOPS.md](docs/DEVOPS.md).

## Critical Agent Rules
- **No Auto-Commit**: Never commit automatically; always list modified files and wait for explicit approval. See [.github/copilot-instructions.md](.github/copilot-instructions.md).
- **Protected Main**: Do not commit to `main`; create a feature branch and open a PR. See [docs/BRANCH_PROTECTION.md](docs/BRANCH_PROTECTION.md).
- **Workflow & PRs**: Issue → branch → changes → commit (referencing issue) → PR with required title/body. See [docs/TASK_MANAGEMENT.md](docs/TASK_MANAGEMENT.md).
- **Backup Convention**: Use `.backup` suffix for file backups (e.g., `file.ext.backup`). See [.github/copilot-instructions.md](.github/copilot-instructions.md).

## PNPM Monorepo Rules
- **Use**: `pnpm` for all installs, scripts, and app runs.
- **Avoid**: `npm`, `npx`, direct `expo` commands. Prefer `pnpm` scripts or `pnpx` when needed. See [.github/copilot-instructions.md](.github/copilot-instructions.md).
- **Common Commands**:
  - `pnpm install`
  - `pnpm app:ios`
  - `pnpm app:android`
  - `pnpm server:dev`
  - `pnpm --filter @smart-pocket/app test`
  - `pnpm build`

## Version Management & CI
- **Source of Truth**: Root [package.json](package.json) `version` (SemVer) and `buildNumber` (continuous).
- **Mobile**: `BUILD_NUMBER` constant in [apps/mobile/app.config.js](apps/mobile/app.config.js).
- **Server**: [apps/server/package.json](apps/server/package.json) `version`.
- **Validation**: GitHub Actions validate sync across these files before merge. See [docs/RELEASE_PIPELINE_SETUP.md](docs/RELEASE_PIPELINE_SETUP.md) and [docs/VERSION_BUMP.md](docs/VERSION_BUMP.md).

## API Client Generation (Orval)
- **Config**: [orval.config.ts](orval.config.ts) — input, output, mutator.
- **Input Spec**: [docs/api-spec.yaml](docs/api-spec.yaml).
- **Output Client**: [apps/mobile/api/generated.ts](apps/mobile/api/generated.ts).
- **HTTP Mutator**: [apps/mobile/api/httpClient.ts](apps/mobile/api/httpClient.ts).
- **Commands**:
  - `pnpm api:generate`
  - `pnpm --filter @smart-pocket/mobile api:generate`

## Authentication Model
- **Homeserver, single-user**: App connects to user’s server.
- **Two-stage auth**:
  - Stage 1: API key → bearer token (`POST /api/v1/connect`). Header: `X-API-Key: <key>`.
  - Stage 2: JWT bearer token for all endpoints. Header: `Authorization: Bearer <token>`.
- **Token TTL**: Controlled by `JWT_EXPIRY`; `expiresIn` returned as seconds. See [docs/API.md](docs/API.md).

## Monetary Price Object & Database Notes
- **Price Standard**: JSON object `{ "amount": "3.99", "currency": "USD" }` (string amount for exact precision). See [docs/PRICE_OBJECT.md](docs/PRICE_OBJECT.md).
- **DB Schema**: PostgreSQL with transactions, line items, products, store_items, price_history, OCR metadata; prices stored as JSONB; fuzzy matching with `pg_trgm`. See [docs/DATABASE.md](docs/DATABASE.md).

## Deployment & Testing
- **Docker Compose**:
  - Dev: [deploy/docker/docker-compose.dev.yml](deploy/docker/docker-compose.dev.yml)
  - Prod: [deploy/docker/docker-compose.prod.yml](deploy/docker/docker-compose.prod.yml)
  - Test: [deploy/docker/docker-compose.test.yml](deploy/docker/docker-compose.test.yml)
- **Scripts**:
  - API tests: [deploy/scripts/test-api.sh](deploy/scripts/test-api.sh)
  - Build smoke tests: [deploy/scripts/test-build.sh](deploy/scripts/test-build.sh)
  - Build & push: [deploy/scripts/push.sh](deploy/scripts/push.sh)
  - Deploy: [deploy/scripts/deploy.sh](deploy/scripts/deploy.sh)
- **DevOps Overview**: See [docs/DEVOPS.md](docs/DEVOPS.md).

## Key Documentation Links
- **Overview & Setup**: [README.md](README.md)
- **Architecture**: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **API**: [docs/API.md](docs/API.md), [docs/api-spec.yaml](docs/api-spec.yaml)
- **Mobile Screens**: [docs/MOBILE_SCREENS.md](docs/MOBILE_SCREENS.md)
- **Postman Collection**: [docs/smart-pocket.postman_collection.json](docs/smart-pocket.postman_collection.json)
- **Task Workflow**: [docs/TASK_MANAGEMENT.md](docs/TASK_MANAGEMENT.md)
- **Release Flow**: [docs/RELEASE_FLOW.md](docs/RELEASE_FLOW.md), [docs/RELEASE_PIPELINE_SETUP.md](docs/RELEASE_PIPELINE_SETUP.md)

## Agent Identity & Response Constraints
- **Identity**: Name is “GitHub Copilot”; if asked about the model, state “GPT-5”. See [.github/copilot-instructions.md](.github/copilot-instructions.md).
- **Policies**: Follow Microsoft content policies; avoid copyrighted content misuse; refuse harmful/hateful/lewd/violent requests with: “Sorry, I can’t assist with that.” See [.github/copilot-instructions.md](.github/copilot-instructions.md).

---

### Notes for Agent Authors
- Prefer minimal, root-cause fixes; don’t refactor unrelated code.
- Preserve existing style and public APIs; small, focused changes.
- When editing code, update relevant docs as needed and validate via tests.
- Before release tasks, confirm version/build sync and run smoke tests.
