# Contributing to Smart Pocket JS

Thank you for your interest in contributing! This guide will help you get started.

## Quick Start

1. **Fork and clone** the repository
2. **Install dependencies**: `pnpm install`
3. **Run tests**: `pnpm run test`
4. **Start development**: `npm run docker:dev`

## Development Workflow

### Project Tasks and Issues

**Creating Tasks:**
- Tasks are created in [GitHub Project #5](https://github.com/users/patterueldev/projects/5) (Smart Pocket Development)
- GitHub automatically creates an issue when you create a task
- Use **natural language** for task/issue titles (not conventional commit format)

**Examples:**
```
✅ "Implement Actual Budget integration layer"
✅ "Add unit tests for OCR parsing"
✅ "Fix camera permission handling on Android"
❌ "feat: Implement Actual Budget integration"
❌ "test: Add unit tests for OCR parsing"
```

### 1. Create a Feature Branch

**Branch Naming Convention:**
```
<type>/<issue#>-<short-description>
```

**Components:**
- `<type>`: feat, fix, docs, refactor, test, chore, build, ci
- `<issue#>`: GitHub issue number with `#` (e.g., #11, #2)
- `<short-description>`: Brief kebab-case description

**Examples:**
```bash
git checkout -b feat/#11-update-docs
git checkout -b fix/#5-camera-permissions
git checkout -b docs/#8-api-documentation
```

### 2. Make Your Changes
- Follow the code conventions in `.github/copilot-instructions.md`
- Write tests for new features
- Keep changes minimal and focused


Use [Conventional Commits](docs/references/conventional-commits-spec.md) format with issue reference:

```bash
git commit -m "feat[#11]: add product search endpoint"
git commit -m "fix[#5]: resolve price calculation rounding"
git commit -m "docs[#8]: update API documentation"
git commit -m "test[#9]: add tests for OCR parsing"
```

**Format:** `<type>[#issue]: <description>`

**Commit types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `test` - Test additions/updates
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `build` - Build/dependency changes
- `chore` - Maintenance tasks

**Commit description rules:**
- Use imperative, present tense: "add" not "added" or "adds"
- Don't capitalize first letter
- No period at the end
- Keep it concise (50 chars or less)
Use conventional commit messages:
```bash
git commit -m "feat: add product search endpoint"
git commit -m "fix: resolve price calculation rounding"
git commit -m "docs: update API documentation"
git commit -m "test: add tests for OCR parsing"
```

**Commit prefixes**:/#11-update-docs
```

Create a Pull Request on GitHub using the template.

**PR Title Format:** `<type>: <description> (#issue)`

**Examples:**
```
feat: Updated docs (#11)
fix: Resolve camera permissions on Android (#5)
docs: Add API documentation (#8)
test: Add unit tests for OCR parsing (#9)
```

**Important:**
- PR titles use the same `<type>` as commits
- Include issue reference in parentheses: `(#11)`
- Use past tense or descriptive format (unlike commits)
- Add `Closes #issue` in PR description to auto-close the issue on merge
- `test:` - Test additions/updates
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build/tooling changes

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub using the template.

## Pull Request Guidelines

### Before Submitting
- [ ] All tests pass locally
- [ ] Code follows project conventions
- [ ] Documentation is updated (if needed)
- [ ] Commits are clean and well-described
- [ ] No unrelated changes included

### PR Checklist
The PR template will guide you through:
- Describing your changes
- Linking related issues
- Confirming test coverage
- Noting any breaking changes
- Updating documentation

### CI Requirements
Your PR must pass:
1. ✅ **Unit Tests** - All existing and new tests pass
2. ✅ **Docker Build** - Images build successfully
3. ✅ **Smoke Tests** - API endpoints work correctly

Optional checks (won't block merge):
- Security scan warnings
- Code coverage reports

## Code Conventions

### Architecture
- **Modular design**: Features are independent packages
- **Core vs Personal**: Keep personal features in `/packages/personal/*`
- **SDK-based**: Core functionality is distributable

### File Structure
```
packages/
  ├── core/           # Core SDK
  ├── server/         # Backend services
  ├── features/       # Feature packages
  │   ├── ocr/
  │   └── price-history/
  ├── personal/       # Personal features (excluded from builds)
  └── shared/         # Shared utilities
```

### TypeScript
- Use TypeScript for all new code
- Define types for API contracts
- Avoid `any` types

### Testing
- Write tests for new features
- Test edge cases and error handling
- Use descriptive test names

### Monetary Values
- Always use a money library (dinero.js, currency.js)
- Store as JSONB objects: `{"amount": "3.99", "currency": "USD"}`
- Never use floating-point arithmetic for money

### Database Changes
- Update `DATABASE.md` with schema changes
- Create migration scripts
- Test rollback procedures

### API Changes
- Update `API.md` documentation
- Update `api-spec.yaml` (OpenAPI spec)
- Update Postman collection
- Maintain backward compatibility when possible

## Testing Your Changes

### Unit Tests
```bash
# Run all tests
pnpm run test

# Run specific package tests
pnpm --filter @smart-pocket/server test

# Watch mode
pnpm run test -- --watch
```

### Integration Tests
```bash
# Start test environment
npm run docker:test

# Test API endpoints
npm run test:api

# Full build + test + cleanup
npm run test:build
```

### Manual Testing
```bash
# Start development stack
npm run docker:dev

# Test in browser
open http://localhost:3000

# Test API
curl http://localhost:3001/health
```

## Common Tasks

### Adding a New Feature Package
1. Create directory: `packages/features/my-feature/`
2. Add `package.json` with proper naming: `@smart-pocket/feature-my-feature`
3. Update workspace configuration
4. Add documentation

### Adding a Personal Feature
1. Create directory: `packages/personal/my-feature/`
2. Configure build exclusion in root `package.json`
3. Document as optional in main README

### Updating Dependencies
```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update package-name

# Check for outdated packages
pnpm outdated
```

### Database Migrations
1. Create migration script in `packages/server/migrations/`
2. Test migration: `npm run migrate`
3. Test rollback
4. Update `DATABASE.md`

## Documentation

### What to Document
- **API changes**: Update `API.md` and OpenAPI spec
- **Database changes**: Update `DATABASE.md`
- **New features**: Update main `README.md`
- **Breaking changes**: Note in PR description and CHANGELOG

### Documentation Files
- `README.md` - Project overview
- `API.md` - API endpoints and usage
- `DATABASE.md` - Database schema
- `DEVOPS.md` - Deployment and operations
- `MOBILE_SCREENS.md` - UI specifications

## Getting Help

### Resources
- Read the architecture docs in `.github/copilot-instructions.md`
- Check existing issues and PRs
- Review test files for examples

### Questions?
- Open a discussion on GitHub
- Comment on related issues
- Tag maintainers in PR if blocked

## Code of Conduct

- Be respectful and constructive
- Focus on the code, not the person
- Welcome newcomers and help them learn
- Keep discussions on-topic

## Recognition

Contributors will be:
- Listed in the project README
- Credited in release notes
- Acknowledged in documentation

Thank you for contributing to Smart Pocket JS! 🎉
