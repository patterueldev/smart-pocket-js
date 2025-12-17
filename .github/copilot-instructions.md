# Smart Pocket JS - AI Coding Instructions

## Quick Reference

Smart Pocket is a personal finance management application with OCR receipt scanning and Actual Budget integration. For detailed architecture, features, and specifications, see the documentation links below.

## Development Workflow

### Git Branch Rules & Workflow

**CRITICAL**: Never commit directly to the `main` branch. ALL changes must follow the documented workflow.

## Complete Change Workflow

**For EVERY change (even minor documentation updates):**

### Step 1: Create Issue First
```bash
# Create issue with proper labels
gh issue create \
  --title "Short descriptive title" \
  --body "## Problem\n[Description]\n\n## Solution\n[Approach]\n\n## Changes\n[What will change]" \
  --label "<type>"  # feat, bug, docs, chore, etc.
```

**Available labels:** `feat`, `bug`, `docs`, `chore`, `refactor`, `test`, `enhancement`, `ci`

### Step 2: Create Branch from Issue
```bash
# Branch naming format: <type>/#<issue-number>-<short-desc>
git checkout -b <type>/#<issue>-<short-description>

# Examples:
# feat/#22-update-docs
# fix/#30-skip-coverage
# docs/#15-api-documentation
# chore/#8-update-dependencies
# release/#69-v0.1.3
```

**Branch naming convention:**
- `feat/#<issue>-<desc>` - New features
- `fix/#<issue>-<desc>` - Bug fixes
- `docs/#<issue>-<desc>` - Documentation updates
- `chore/#<issue>-<desc>` - Maintenance tasks
- `refactor/#<issue>-<desc>` - Code refactoring
- `test/#<issue>-<desc>` - Test additions/updates
- `release/#<issue>-v<version>` - Version releases (e.g., `release/#69-v0.1.3`)

**Branch naming rules** (enforced by CI):
- Must follow pattern: `<type>/#<issue>-<dashed-description>`
- Type must be one of: feat, fix, docs, chore, refactor, test, build, ci, perf, revert, release
- Must include issue number after `/#`
- Description must be lowercase with dashes (kebab-case)
- If branch name is invalid, PR checks will fail - you must recreate the branch

### Step 3: Make Changes (NO AUTO-COMMIT)
- **NEVER auto-commit changes**
- Make all necessary updates
- Show user what changed
- **WAIT for user approval** before committing
- User will review and decide when to commit

### Step 4: Commit & Push (After User Approval)
```bash
# Only after user explicitly approves:
git add <files>
git commit -m "<type>: <description> (#<issue>)

- Detail 1
- Detail 2
- Detail 3"

git push -u origin <branch-name>
```

**Commit message format:**
- Format: `<type>: <description> (#<issue>)`
- Types: feat, fix, docs, chore, refactor, test, build, ci, perf
- Must include issue number in parentheses
- Body: Bullet points with details

### Step 5: Create Pull Request
```bash
gh pr create \
  --title "<type>: <Title>" \
  --body "## Description
[What this PR does]

Closes #<issue>

## Changes Made
- Change 1
- Change 2

## Testing
- Test approach"
```

**PR title format:** `<type>: <Title>` (NO issue number - GitHub adds PR # on merge)
**PR body:** Must start with `Closes #<issue>` to link and auto-close issue

## Main Branch Protection

**Main branch is protected:**
- ✅ Cannot push directly to main
- ✅ All changes must go through PRs
- ✅ All CI checks must pass
- ✅ Branch must be up-to-date with main before merging
- ✅ Issue must exist before creating branch
- ✅ Commits must reference issue number

## Emergency Checks

**If accidentally on main:**
```bash
# Check current branch
git branch --show-current

# If output is "main", immediately:
# 1. Create issue first (if doesn't exist)
# 2. Then create branch:
git checkout -b fix/#<issue>-<short-desc>
```

**If branch created without issue:**
```bash
# STOP - Create issue first
gh issue create --title "..." --body "..." --label "..."
# Then create properly named branch
git checkout -b <type>/#<issue>-<desc>
```

### Docker Commands

**Development**:
```bash
npm run docker:dev        # Start development stack with hot-reload
```

**Production**:
```bash
npm run docker:prod       # Start production stack
```

**Testing**:
```bash
npm run docker:test       # Run test environment (disposable)
npm run test:api          # Test API endpoints against running services
npm run test:build        # Build, test, destroy (full smoke test)
```

**Deployment**:
```bash
npm run docker:build      # Build Docker images
npm run docker:push       # Push images to registry
npm run deploy            # Deploy to homeserver
```

### Package Scripts
```bash
npm run dev               # Local development (no Docker)
npm run build             # Build all packages
npm run test              # Unit & integration tests
npm run test:coverage     # Tests with coverage report
```

**See [DEVOPS.md](../docs/DEVOPS.md) for comprehensive deployment documentation**

## Pull Request Creation Guidelines

**CRITICAL**: When creating pull requests via `gh pr create`, **ALWAYS** use this exact format:

### PR Title Format (REQUIRED)
```
<type>: <description>
```

**Components**:
- `<type>`: feat, fix, docs, test, refactor, chore, build, ci, perf
- `<description>`: Clear, concise description (imperative mood: "add", "fix", "update")
- **NO issue number in title** - GitHub automatically adds PR # on merge

**PR Body Requirements**:
- Must start with `Closes #<issue>` to link and auto-close the issue
- This creates the GitHub link between PR and issue

**Valid PR Titles**:
```
feat: Add transaction batch import
fix: Resolve camera permissions on Android
docs: Update API documentation
chore: Bump version to 0.2.0
test: Add unit tests for OCR parsing
refactor: Improve error handling in sync
```

**Invalid Examples** (DO NOT USE):
```
❌ Update docs                           (missing type)
❌ feat: add transaction batch import    (lowercase after colon)
❌ Fix bug #23                           (issue # in title)
❌ feat: Add import (#45)                (issue # in title)
❌ docs: Update API documentation.       (period at end)
```

**Final Merge Commit Example**:
- PR title: `feat: Add transaction batch import`
- PR body: `Closes #45`
- GitHub merge: `feat: Add transaction batch import (#47)` ← PR number added automatically

### PR Title Rules
1. **Type prefix is mandatory**: Must start with `<type>:`
2. **NO issue number in title**: Issue linked via `Closes #<issue>` in body
3. **Description case**: First word after colon should be capitalized
4. **No period at end**: Never end with `.`
5. **Imperative mood**: "Add" not "Added", "Fix" not "Fixed"

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

**External APIs:**
- [external-apis/](../docs/external-apis/) - Integration guides for Actual Budget, OpenAI, Google Sheets, PostgreSQL

## Testing Approach

- Unit tests with Jest (70% coverage threshold in PRs)
- Integration tests for API endpoints
- Docker smoke tests for full stack validation
- Main branch CI runs tests without coverage enforcement (already validated in PR)

## Common Patterns

- Prefer TypeScript for type safety across all packages
- Always consider feature modularity - ask "should this be optional?" when implementing features
- When integrating with Actual Budget, consider the abstraction layer carefully
- Support international receipts (multi-currency consideration)
- Design personal features as opt-in/configurable
