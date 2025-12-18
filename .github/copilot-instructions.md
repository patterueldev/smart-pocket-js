# Smart Pocket JS - AI Coding Instructions

## Quick Reference

Smart Pocket is a personal finance management application with OCR receipt scanning and Actual Budget integration. For detailed architecture, features, and specifications, see the documentation links below.

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
   git commit -m "<type>: <description> (#<issue>)"
   git push -u origin <branch-name>
   ```
   
   **Commit Format (REQUIRED):**
   - `<type>: <description> (#<issue>)`
   - See [Conventional Commits Spec](../docs/references/conventional-commits-spec.md)

5. **Create PR** (uses conventional commits)
   ```bash
   gh pr create --title "<type>: <Title>" --body "Closes #<issue>"
   ```
   
   **PR Format (REQUIRED):**
   - Title: `<type>: <Description>` (NO issue #)
   - Body: Must include `Closes #<issue>`
   - See PR formatting rules below

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

**Types:** feat, fix, doc (Conventional Commits)

**📘 Full specification:** [docs/references/conventional-commits-spec.md](../docs/references/conventional-commits-spec.md)

Format: `<type>: <description> (#<issue>)`

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
feat: Add transaction batch import (#45)
fix: Resolve camera permissions (#52)
docs: Update API documentation (#18)
chore: Update dependencies (#60)
```

### PR Title Format (Conventional Commits)

Format: `<type>: <Title>`

**CRITICAL Rules:**
- **Must follow conventional commits** (same types as commits)
- **NO issue number in title** (linked via PR body)
- First word capitalized
- No period at end
- Issue linked with `Closes #<issue>` in PR body

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
```

**Valid Examples:**
```
✅ feat: Add transaction batch import
✅ fix: Resolve camera permissions
✅ docs: Update API documentation
✅ chore: Streamline task management workflow
```

**Invalid Examples:**
```
❌ feat: add import          (lowercase after colon)
❌ Fix bug #23              (issue # in title)
❌ feat: Add import (#45)   (issue # in title)
❌ Add import               (missing type prefix)
❌ feat: Add import.        (period at end
**Examples:**
```
✅ feat: Add transaction batch import
✅ fix: Resolve camera permissions
✅ docs: Update API documentation

❌ feat: add import          (lowercase)
❌ Fix bug #23              (issue # in title)
❌ feat: Add import (#45)   (issue # in title)
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
- Main branch CI runs tests without coverage enforcement (already validated in PR)

## Common Patterns

- Prefer TypeScript for type safety across all packages
- Always consider feature modularity - ask "should this be optional?" when implementing features
- When integrating with Actual Budget, consider the abstraction layer carefully
- Support international receipts (multi-currency consideration)
- Design personal features as opt-in/configurable
