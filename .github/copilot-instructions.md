# Smart Pocket JS - AI Coding Instructions

## Quick Reference

Smart Pocket is a personal finance management application with OCR receipt scanning and Actual Budget integration. For detailed architecture, features, and specifications, see the documentation links below.

## Read First
1. README.md (overview, quick start)
2. docs/REQUIREMENTS.md (original requirements)
3. docs/MVP.md (features & acceptance criteria)
4. docs/TECH_STACK.md (choices & rationale)
5. docs/ARCHITECTURE.md (structure & patterns)
6. docs/INFRASTRUCTURE.md (deployment & CI/CD)

## Conventions
- Branch: `<type>/#<issue>-<short-hyphenated-desc>`
- Commit: `<type>: <description>`
- PR title: `<type>: #<issue> <Platform> - <description>`
   - Issue number required
   - Platform optional but preferred (Backend, Server, Web, Mobile, iOS, Android)
   - Start with capital letter, no period at end, use imperative mood
- PR body: Include testing notes, risks, rollback plan, and `Closes #<issue>`

## Development Environment Setup

### Environment Prerequisites

- Node.js 20+
- pnpm 8+
- Android SDK/Xcode (when building locally)

Run all commands directly with `pnpm` from the repository root.

### PNPM Monorepo (CRITICAL)

**This is a pnpm workspace monorepo - NEVER use npm, npx, or direct expo commands.**

**Package Manager Rules:**
- ✅ Use: `pnpm` for all package management
- ✅ Use: `pnpm app:ios`, `pnpm app:android` for running apps
- ✅ Use: `pnpm --filter @smart-pocket/app <command>` for package-specific commands
- ✅ Use: `pnpx` if you need npx-like behavior (e.g., `pnpx expo-cli`)
- ❌ DO NOT use: `npm install`, `npm run`, `npx`
- ❌ DO NOT use: `expo run:ios` directly (use `pnpm app:ios` instead)
- ❌ DO NOT use: `npx expo` (use pnpm scripts or `pnpx`)

**Why:**
- pnpm creates different node_modules structure (`.pnpm` directory with hashes)
- Direct npm/npx/expo commands will fail or use wrong dependencies
- All scripts are configured in root package.json to work with pnpm

**Workspace Structure:**
```
apps/ (entrypoints)
   ├── server/       (Node.js backend)
   └── mobile/       (React Native/Expo app)

packages/
   ├── shared/       (Shared TypeScript types / UI)
   ├── features/     (Feature packages)
   └── personal/     (Personal features, excluded from builds)
```

**Common Commands:**
```bash
# Install dependencies (from root)
pnpm install

# Run iOS app
pnpm app:ios

# Run Android app
pnpm app:android

# Run server
pnpm server:dev

# Run tests for specific package
pnpm --filter @smart-pocket/app test

# Build all packages
pnpm build
```

**If you see errors like:**
- `command not found: pnpm` → Install pnpm 8+ (https://pnpm.io/installation)
- `command not found: expo` → Use `pnpm app:ios` instead of `expo run:ios`
- PNPM path errors with CocoaPods → Run `pnpm app:ios` which handles pod installation correctly

### API Client Generation (Orval)

**This project uses Orval to generate type-safe API clients from OpenAPI specs.**

**Workflow:**
1. Update [docs/api-spec.yaml](../docs/api-spec.yaml) with new endpoints
2. Run `pnpm api:generate` to regenerate [apps/mobile/api/generated.ts](../apps/mobile/api/generated.ts)
3. Import generated types and functions in your service layer
4. Map API response DTOs to UI-friendly models

**Configuration:** [orval.config.ts](../orval.config.ts)
- Input: `docs/api-spec.yaml` (OpenAPI 3.0 spec)
- Output: `apps/mobile/api/generated.ts` (generated client)
- Mutator: `apps/mobile/api/httpClient.ts` (HTTP client with auth)

**Usage Pattern:**
```typescript
// Import generated client and types
import { postApiV1Connect, PostApiV1ConnectBody } from '../api/generated';

// Call API
const response = await postApiV1Connect({ deviceInfo: { ... } });

// Map DTO → UI model
const mapped = mapResponseToUIModel(response.data);
```

**Service Layer Convention:**
- Create services in `apps/mobile/services/` (e.g., `googleSheetsSyncService.ts`)
- Services call generated client functions and map DTOs to UI models
- Export typed interfaces for UI components to consume
- Keep DTO mapping logic in service layer, not in components

**Commands:**
```bash
# Regenerate API client after spec changes
pnpm api:generate

# Mobile-specific generation (if needed)
pnpm --filter @smart-pocket/mobile api:generate
```

## 🚨 CRITICAL RULES 🚨

### 1. NO AUTO-COMMIT - EVER

**This is the MOST IMPORTANT rule:**

- **NEVER commit changes automatically**
- **ALWAYS show the user what files changed** (using `git status`, `git diff`, or listing modified files)
- **WAIT for EXPLICIT user approval** before running `git add` or `git commit`
- User must review changes and say "commit these changes" or similar before you proceed

**Why this matters:**
- User needs to review all modifications before they're committed
- Prevents accidental commits of sensitive data, debug code, or mistakes
- Gives user control over what goes into version control

**This applies to ALL changes:**
- Code modifications
- Documentation updates
- Configuration changes
- Any file modifications whatsoever

**Workflow:**
1. Make changes to files
2. Show user: "I've modified these files: [list]. Would you like to review the changes before committing?"
3. Wait for user confirmation
4. Only then: `git add` and `git commit`
### Auto-Commit Clarifications (User-Controlled)

The default remains NO AUTO-COMMIT. The following clarifications apply to make intent explicit:

- When the user asks for changes, implement them without committing. Do not stage or commit until explicitly asked.
- When the user explicitly says “let’s commit,” stage, commit, and push the current changes. After that, resume the default (no auto-commit) for subsequent edits unless told otherwise.
- Exception window: If the user explicitly says “auto-commit for the next 5 minutes” (or similar), auto-commit changes during that time-boxed window only. When the window ends, revert to the default no auto-commit behavior.
- Always summarize what will be committed and link to the modified files before committing, unless operating within an explicitly granted auto-commit window.


### 2. Never Commit to Main Branch

- Main branch is protected
- ALL changes must go through Pull Requests
- Always create a feature branch first

### 3. File Backup Convention

- When backing up old versions of files, use the `.backup` extension
- Format: `filename.ext.backup`
- Examples: `copilot-instructions.md.backup`, `config.json.backup`
- This keeps backups consistent and easy to identify

## Development Workflow

**📘 Complete workflow documented in:** [docs/TASK_MANAGEMENT.md](../docs/TASK_MANAGEMENT.md)

### Quick Workflow Summary

1. **Create Issue** (automated with project linking)
   ```bash
   ./.github/scripts/create-issue.sh --title "..." --body "..."
   ```
   
   **Issue Title Format:** Use natural language (not conventional commits)
   - ✅ "Create OCR scan screen"
   - ✅ "Mobile: Add transaction form"
   - ✅ "Backend: Implement batch import"
   - ✅ "Fix camera permissions on Android"
   - ❌ "feat: Create OCR scan screen"

2. **Create Branch** from issue (uses conventional commit types)
   ```bash
   git checkout -b <type>/#<issue>-<short-desc>
   ```
   Examples: `feat/#22-ocr-screen`, `fix/#30-camera-bug`, `docs/#40-api-docs`

3. **Make Changes** (NO AUTO-COMMIT - show user changes first!)

4. **Commit** (only after user approval, uses conventional commits)
   ```bash
   git add <files>
   git commit -m "<type>: <description>"
   git push -u origin <branch-name>
   ```
   
   **Commit Format (REQUIRED):**
   - `<type>: <description>` (no issue number in commit message)
   - See [Conventional Commits Spec](../docs/references/conventional-commits-spec.md)

5. **Create PR**
   ```bash
   gh pr create --title "<type>: #<issue> <Platform> - <Title>" --body "Closes #<issue>\n\nTesting Notes:\n- ...\n\nRisks & Rollback:\n- ..."
   ```
   
   **PR Format (REQUIRED):**
   - Title: `<type>: #<issue> <Platform> - <Description>`
   - Body: Must include `Closes #<issue>`, testing notes, risks, rollback

**Task Types Available:**
- **User Story** - High-level feature (can have child tasks)
- **Mobile** - iOS/Android implementation
- **Backend** - Server/API implementation
- **Mobile & Backend** - Fullstack feature
- **Bug** - Bug fixes (specify component)
- **CI** - GitHub Actions, automation
- **Documentation** - Docs updates
- **Release** - Version bumps

### Automated Project Status

GitHub Actions automatically updates issue status:
- Issue created → **Todo**
- PR opened → **In Progress**
- PR ready for review → **In Review**  
- PR merged to main → **QA/Testing**
- Release PR merged → **Done**

No manual status updates needed!

### Branch Naming Convention

Format: `<type>/#<issue>-<short-description>`

**Types:** feat, fix, docs, refactor, test, chore, build, ci, perf, revert

**📘 Full specification:** [docs/references/conventional-commits-spec.md](../docs/references/conventional-commits-spec.md)

Format: `<type>: <description>`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `chore` - Maintenance tasks
- `refactor` - Code refactoring
- `test` - Test changes
- `ci` - CI/CD changes
- `perf` - Performance improvements
- `build` - Build system changes
- `revert` - Revert previous commit

**Rules:**
- Include issue number in parentheses
- Imperative mood ("add" not "added")
- First word capitalized
- No period at end

**Examples:**
```
feat: Add transaction batch import
fix: Resolve camera permissions
docs: Update API documentation
chore: Update dependencies
```

### PR Title Format

Format: `<type>: #<issue> <Platform> - <Description>`

**Rules:**
- Use conventional commit types
- Issue number required; platform optional but preferred
- First word capitalized; no period at end; imperative mood

**PR Body Template:**
```markdown
## Description
[What this PR does]

Closes #<issue>

## Changes Made
- Change 1
- Change 2

## Testing
- How it was tested

## Risks & Rollback
- Risks
- Rollback plan
```

## Docker Commands

```bash
npm run docker:dev        # Development with hot-reload
npm run docker:prod       # Production stack
npm run docker:test       # Test environment (disposable)
npm run test:api          # Test API endpoints
npm run test:build        # Build & smoke test
```

**See [DEVOPS.md](../docs/DEVOPS.md) for comprehensive deployment documentation**

## Key Development Notes

### Architecture
- **SDK-based architecture**: Features are independent packages in a monorepo
- **Build-time exclusions**: Personal features excluded from distributed builds
- **Authentication**: Two-stage (API key → bearer token, 30-day expiry)
- **Deployment**: Homeserver model - each user runs their own Docker instance
- **Package management**: pnpm workspaces for monorepo

### Data Handling
- **Monetary calculations**: Always use a proper money library (dinero.js, currency.js)
  - Never use raw floating-point arithmetic for prices
  - Database stores JSONB price objects: `{"amount": "3.99", "currency": "USD"}`
- **Item codes**: Store-specific, same product has different codes at different merchants
  - Design for code → product mapping per store (via `store_items` table)
  - `payee_id` in `store_items` IS the store reference

### Primary Features
- **OCR workflow is the primary feature** - prioritize this in architectural decisions
- Store raw OCR data + corrections for future ML fine-tuning
- **PostgreSQL schema**: Design for relationships - transactions → line items → price history
- Sync strategy: PostgreSQL detailed DB → Actual Budget simplified transactions

### Docker Deployment
- 4 services: smart-pocket-server, smart-pocket-web, postgresql, actual-budget
- 3 environments: development (hot-reload), production (optimized), test (disposable)
- Testing: unit/integration, runtime API tests, build smoke tests

### React Native
- Target both mobile (iOS/Android) and web platforms
- Web version built as static site, served via nginx in Docker
- Mobile app must support configurable server endpoints

## Documentation References

**Architecture & Design:**
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture, tech stack, deployment model
- [FEATURES.md](../docs/FEATURES.md) - Feature planning and optional features
- [DATABASE.md](../docs/DATABASE.md) - PostgreSQL schema
- [PRICE_OBJECT.md](../docs/PRICE_OBJECT.md) - Price standardization

**API & Integration:**
- [API.md](../docs/API.md) - API endpoints and workflows
- [api-spec.yaml](../docs/api-spec.yaml) - OpenAPI 3.0 specification
- [Postman Collection](../docs/smart-pocket.postman_collection.json) - Ready-to-use API testing

**Mobile & UI:**
- [MOBILE_SCREENS.md](../docs/MOBILE_SCREENS.md) - UI specifications (for when mobile development starts)

**DevOps:**
- [DEVOPS.md](../docs/DEVOPS.md) - Docker, testing, deployment
- [TASK_MANAGEMENT.md](../docs/TASK_MANAGEMENT.md) - Complete task workflow guide

**External APIs:**
- [external-apis/](../docs/external-apis/) - Integration guides for Actual Budget, OpenAI, Google Sheets, PostgreSQL

## Testing Approach

- Unit tests with Jest (70% coverage threshold in PRs)
- Integration tests for API endpoints
- Docker smoke tests for full stack validation
- Tests validated in PR checks before merge

## Common Patterns

- Prefer TypeScript for type safety across all packages
- Always consider feature modularity - ask "should this be optional?" when implementing features
- When integrating with Actual Budget, consider the abstraction layer carefully
- Support international receipts (multi-currency consideration)
- Design personal features as opt-in/configurable
