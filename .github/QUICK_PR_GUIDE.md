# Quick Start: PR with GitHub Copilot

Your immediate next steps to create a PR using GitHub Copilot.

## Current Status

You have uncommitted changes:
- GitHub Actions workflows
- External API documentation
- PR templates and guides

Let's create a PR with Copilot's help!

---

## Step 1: Commit Your Changes

```bash
# Stage all changes
git add .github/ docs/external-apis/ README.md CONTRIBUTING.md

# Let Copilot suggest a commit message
gh copilot suggest "generate a commit message for adding GitHub Actions workflows, PR templates, and external API documentation"

# Or use this message:
git commit -m "ci: add CI/CD infrastructure and API documentation

- Add GitHub Actions workflows (pr-check, main-ci, nightly)
- Add PR template and contribution guide
- Create external API documentation directory
  - Actual Budget integration guide
  - OpenAI receipt parsing guide
  - PostgreSQL features and extensions
  - Google Sheets sync guide (personal)
- Add working code examples for each API
- Add AI assistant guide for using docs
- Update main README with documentation links"

# Push to remote
git push origin feat/build
```

---

## Step 2: Create PR with Copilot

### Option A: Interactive with GitHub CLI

```bash
# Create PR interactively
gh pr create --web
```

This opens your browser where you can:
- Use the PR template that was created
- Fill in the sections
- Create the PR

### Option B: Use Copilot to Generate Description

```bash
# Ask Copilot to generate the full PR command
gh copilot suggest "create a pull request from feat/build to main with a description about adding CI/CD and API documentation"

# Copilot will suggest something like:
gh pr create \
  --title "ci: Add CI/CD infrastructure and external API documentation" \
  --body "## Description
This PR adds comprehensive CI/CD infrastructure and external API reference documentation.

## Type of Change
- [x] Infrastructure/DevOps change
- [x] Documentation update

## Changes Made
- Added GitHub Actions workflows for PR validation, main branch CI, and nightly tests
- Created PR template following project conventions
- Added contribution guide with development workflow
- Created external API documentation for:
  - Actual Budget (transaction sync)
  - OpenAI (receipt parsing)
  - PostgreSQL (database features)
  - Google Sheets (personal balance sync)
- Added working code examples for each API
- Created AI assistant guide for documentation usage

## Testing
- [x] Workflows are syntactically valid
- [x] Documentation follows established patterns
- [x] Examples are runnable
- [x] No code changes - documentation only

## Documentation
- [x] Added comprehensive documentation
- [x] Updated main README
- [x] Created workflow guides

## Checklist
- [x] Documentation is clear and complete
- [x] Examples are working code
- [x] No secrets in repository
- [x] Follows project conventions"
```

### Option C: Simple Command

```bash
# Quick PR creation
gh pr create \
  --title "ci: Add CI/CD infrastructure and external API documentation" \
  --body "Adds GitHub Actions workflows, PR templates, and comprehensive external API documentation. See commit message for details." \
  --label "documentation,infrastructure"
```

---

## Step 3: Verify PR is Created

```bash
# View your PR
gh pr view

# Check CI status
gh pr checks --watch

# View in browser
gh pr view --web
```

---

## Step 4: Self-Review with Copilot

```bash
# Review your own changes
gh pr diff

# Ask Copilot to review
gh copilot suggest "review this PR for any issues in the GitHub Actions workflows"

# Check specific files
gh copilot suggest "is there anything wrong with this workflow file: $(cat .github/workflows/pr-check.yml)"

# Security check
gh copilot suggest "check for security issues in these GitHub Actions workflows"
```

---

## Step 5: Wait for CI Checks

Your PR will trigger:
- ✅ Lint & Unit Tests (if they exist)
- ✅ Docker Build (might fail if not all components exist yet)
- ✅ Smoke Tests (might fail if services aren't ready)
- ✅ Security Scan

If checks fail:

```bash
# View CI logs
gh pr checks

# Debug with Copilot
gh copilot suggest "why did the 'Docker Build & Smoke Tests' check fail?"

# Fix and push
# CI will re-run automatically
```

---

## Step 6: Address Review Feedback (if any)

```bash
# Get review comments
gh pr view --comments

# Use Copilot to help address feedback
gh copilot suggest "how to address this review comment: [COMMENT]"

# Make changes
git add .
git commit -m "fix: address review feedback"
git push
```

---

## Step 7: Merge When Ready

```bash
# Check if ready to merge
gh pr checks
gh pr view

# Merge with squash (recommended)
gh pr merge --squash --delete-branch

# Or use Copilot to suggest
gh copilot suggest "merge this PR with appropriate strategy"
```

---

## Current PR Preview

**Title**: `ci: Add CI/CD infrastructure and external API documentation`

**Changes**:
- 📝 7 workflow/template files (`.github/`)
- 📚 11 API documentation files (`docs/external-apis/`)
- 📖 1 contribution guide (`CONTRIBUTING.md`)
- 🔧 Updated main `README.md`

**Total**: ~60 KB of documentation and configuration

**Impact**: 
- ✅ Automated testing on every PR
- ✅ Comprehensive API reference for developers
- ✅ Clear contribution guidelines
- ✅ AI-friendly documentation structure

---

## Common Issues & Copilot Solutions

### Issue: CI Checks Failing

```bash
# Ask Copilot why
gh copilot suggest "analyze why these CI checks failed: $(gh pr checks)"

# Common fixes:
# - Docker build might fail if images don't exist yet
# - Tests might fail if no tests exist yet
# - This is expected for first PR - workflows are being added
```

### Issue: Merge Conflicts

```bash
# Check for conflicts
gh pr diff | grep "<<<<<<<"

# Resolve with Copilot
gh copilot suggest "how to resolve merge conflicts in .github/workflows/pr-check.yml"

# Update and push
git add .
git commit -m "fix: resolve merge conflicts"
git push
```

### Issue: Need to Update PR Description

```bash
# Edit PR
gh pr edit --add-body "Additional context here"

# Or regenerate with Copilot
gh copilot suggest "add a note to PR description about documentation structure"
```

---

## After Merge: Next Steps

Once this PR is merged:

1. **Test the Workflows**: Create a small test PR to verify workflows run
2. **Use the Documentation**: Reference API docs when implementing features
3. **Iterate**: Improve workflows and docs based on usage

---

## Quick Command Reference

```bash
# Create PR
gh pr create --web

# View PR status  
gh pr view

# Check CI
gh pr checks --watch

# Review with Copilot
gh copilot suggest "review this PR"

# Merge
gh pr merge --squash --delete-branch
```

---

## Copilot Tips for This PR

### Get PR Summary
```bash
gh copilot explain "summarize the changes in this PR"
```

### Verify Workflows
```bash
gh copilot suggest "check if these GitHub Actions workflows are correct"
```

### Generate Release Notes
```bash
gh copilot suggest "create release notes for this PR"
```

### Next PR Ideas
```bash
gh copilot suggest "what should I work on next after this PR?"
```

---

## Ready to Go! 🚀

You're all set to create your PR. Use any of the commands above to get started!

**Recommended Flow**:
1. Commit changes with the suggested message
2. Push to origin
3. Run: `gh pr create --web`
4. Fill in the template
5. Create PR
6. Let GitHub Actions validate your work!

Good luck! 🎉
