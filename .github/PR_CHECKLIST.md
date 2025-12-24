# Pre-PR Checklist

Before creating your pull request, ensure you've completed these steps:

## ✅ Code Quality

- [ ] Code follows project conventions (see `.github/copilot-instructions.md`)
- [ ] TypeScript types are properly defined (no `any` types)
- [ ] Monetary calculations use proper money library (not raw floats)
- [ ] Feature is modular and properly categorized (core/optional/personal)
- [ ] No unrelated changes or formatting-only commits

## 🧪 Testing

- [ ] Unit tests pass locally: `pnpm run test`
- [ ] Coverage is maintained: `pnpm run test:coverage`
- [ ] Docker builds successfully: `./deploy/scripts/build.sh`
- [ ] Smoke tests pass: `./deploy/scripts/smoke-test.sh`
- [ ] Manual testing completed (if UI/API changes)

## 📚 Documentation

- [ ] Code is self-documenting or has necessary comments
- [ ] JSDoc added for new public functions/classes
- [ ] README.md updated (if feature-level changes)
- [ ] API.md updated (if API endpoints changed)
- [ ] DATABASE.md updated (if schema changed)
- [ ] OpenAPI spec updated: `api-spec.yaml` (if API changed)

## 🔍 Database & API

### If Database Schema Changed:
- [ ] Updated `DATABASE.md` with new schema
- [ ] Created migration script (if needed)
- [ ] Tested migration forward and rollback
- [ ] Updated relevant queries in code

### If API Endpoints Changed:
- [ ] Updated `API.md` documentation
- [ ] Updated `api-spec.yaml` (OpenAPI 3.0 spec)
- [ ] Updated Postman collection (if exists)
- [ ] Maintained backward compatibility OR documented breaking changes
- [ ] Added/updated tests for endpoints

## 🐛 Issue Tracking

- [ ] Linked to related issue(s) using `Closes #123`
- [ ] Issue acceptance criteria met
- [ ] Breaking changes noted in PR description

## 🔐 Security

- [ ] No secrets or API keys in code
- [ ] No sensitive data in logs or error messages
- [ ] Environment variables properly configured
- [ ] User inputs validated and sanitized

## 🚀 Deployment

- [ ] No environment variable changes needed
- [ ] OR documented required env changes
- [ ] No database migration needed
- [ ] OR migration script ready and tested
- [ ] No breaking changes
- [ ] OR breaking changes documented with migration path

## 📦 Dependencies

- [ ] New dependencies are justified and documented
- [ ] Dependencies are pinned to specific versions
- [ ] No security vulnerabilities in new deps: `pnpm audit`
- [ ] License compatibility checked

## 🎯 Commit Quality

- [ ] Commits use conventional commit format:
  - `feat:` for features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `test:` for tests
  - `refactor:` for refactoring
  - `perf:` for performance
  - `chore:` for maintenance
- [ ] Commits are atomic and focused
- [ ] Commit messages are clear and descriptive

## 🤝 Collaboration

- [ ] PR title follows format: `<type>: #<issue> <Platform> - <description>`
- [ ] Branch name follows format: `<type>/#<issue>-<short-description>`
- [ ] PR description explains what and why
- [ ] Breaking changes highlighted
- [ ] Screenshots/videos added (if UI changes)
- [ ] Requested reviewers assigned
- [ ] Labels added (if applicable)

## �� Final Checks

Run these commands before submitting:

```bash
# 1. Run all tests
pnpm run test

# 2. Check coverage
pnpm run test:coverage

# 3. Build Docker images
./deploy/scripts/build.sh

# 4. Run smoke tests
./deploy/scripts/smoke-test.sh

# 5. Check for uncommitted changes
git status

# 6. Review your changes
git diff main...your-branch
```

## 🚦 GitHub Actions Will Run

Once you create the PR, these checks will run automatically:

1. **Lint & Unit Tests** - All package tests must pass
2. **Docker Build** - Images must build successfully  
3. **Smoke Tests** - API endpoints must work correctly
4. **Security Scan** - No high-severity vulnerabilities

If any fail, review the logs and fix locally before pushing again.

## 💡 Tips

- **Keep PRs small**: Easier to review, faster to merge
- **One concern per PR**: Don't mix features with refactoring
- **Test edge cases**: Not just happy path
- **Ask questions**: Better to clarify than guess
- **Be patient**: Reviews take time, maintainers are volunteers

## 📖 References

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Full contribution guide
- [API.md](../docs/API.md) - API documentation
- [DATABASE.md](../docs/DATABASE.md) - Database schema
- [DEVOPS.md](../docs/DEVOPS.md) - Deployment guide

---

**Remember**: The goal is quality, not speed. Take time to do it right! ✨
