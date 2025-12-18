# Task Management Workflow

## Overview

Smart Pocket uses GitHub Issues and Projects (v2) for task tracking with automated status transitions. This guide consolidates the complete workflow from task creation to completion.

## Quick Reference

```bash
# Create issue and add to project
./.github/scripts/create-issue.sh --title "feat: Your feature" --body "Description"

# Create branch
git checkout -b <type>/#<issue>-<short-desc>

# Make changes (no auto-commit - show user changes first)
# Commit only after user approval
git add .
git commit -m "<type>: <description> (#<issue>)"
git push -u origin <branch-name>

# Create PR
gh pr create --title "<type>: <Title>" --body "Closes #<issue>"
```

## Workflow Stages

The project uses 5 status stages with **automated transitions**:

| Status | When | Automated? |
|--------|------|------------|
| **Todo** | Issue created | ✅ Auto (GitHub Action) |
| **In Progress** | PR opened (non-draft) | ✅ Auto (GitHub Action) |
| **In Review** | PR ready for review | ✅ Auto (GitHub Action) |
| **QA/Testing** | PR merged to main | ✅ Auto (GitHub Action) |
| **Done** | Release PR merged | ✅ Auto (GitHub Action) |

## Detailed Workflow

### Step 1: Create Issue

**Option A: Using Helper Script (Recommended)**

```bash
./.github/scripts/create-issue.sh \
  --title "Short descriptive title" \
  --body "## Problem
[Description]

## Solution
[Approach]

## Changes
[What will change]" \
  --label "enhancement"
```

The script automatically adds the issue to the "Smart Pocket Development" project.

**Option B: Manual with Templates**

1. Go to [New Issue](https://github.com/patterueldev/smart-pocket-js/issues/new/choose)
2. Select template:
   - **User Story** - Feature requests with child tasks
   - **Mobile Task** - Mobile implementation (iOS/Android)
   - **Backend Task** - Server/API implementation
   - **Mobile & Backend Task** - Fullstack changes
   - **Bug** - Bug reports
   - **CI/CD Task** - GitHub Actions, automation
   - **Documentation Task** - Docs updates
   - **Release** - Version bumps
3. Fill in the template fields
4. Submit

**Task Types:**
- **User Story** - High-level feature (can have child tasks)
- **Mobile** - iOS/Android implementation
- **Backend** - Server/API implementation
- **Mobile & Backend** - Fullstack feature
- **Bug** - Bug fixes (specify component: Mobile, Backend, CI, etc.)
- **CI** - GitHub Actio (User Stories, Mobile, Backend, Mobile & Backend tasks)
- `fix` - Bug fixes
- `docs` - Documentation
- `chore` - Maintenance, dependency updates
- `refactor` - Code refactoring
- `test` - Tests
- `ci` - CI/CD changes
- `release` - Version releases

**Examples:**
```bash
git checkout -b feat/#22-ocr-scan-screen        # Mobile task
git checkout -b feat/#30-batch-import-api       # Backend task
git checkout -b fix/#40-camera-permissions      # Bug fix
git checkout -b docs/#50-api-documentation      # Documentation
git checkout -b ci/#60-project-automation       # CI task
git checkout -b release/#69-v0.1.3              # Release
```

**Branch Naming Rules** (enforced by CI):
- Must match pattern: `<type>/#<issue>-<dashed-description>`
- Type must be valid (see list above)
- Must include issue number after `/#`
- Description must be lowercase with dashes (kebab-case)

**Note:** Even though **issue titles use natural language**, **branch names still use conventional commit types** (`feat`, `fix`, `docs`, etc.) for consistency with Git history.
**Types:**
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation
- `chore` - Maintenance
- `refactor` - Code refactoring
- `test` - Tests
- `release` - Version releases

**Examples:**
```bash
git checkout -b feat/#22-update-docs
git checkout -b fix/#30-skip-coverage
git checkout -b release/#69-v0.1.3
```

**Branch Naming Rules** (enforced by CI):
- Must match pattern: `<type>/#<issue>-<dashed-description>`
- Type must be valid (see list above)
- Must include issue number after `/#`
- Description must be lowercase with dashes (kebab-case)

### Step 3: Make Changes

**CRITICAL: NO AUTO-COMMIT**

- **NEVER auto-commit changes**
- Make all necessary updates
- Show user what changed (git status, git diff)
- **WAIT for explicit user approval** before committing
- User reviews and decides when to commit

This rule is **absolute** and applies to:
- Code changes
- Documentation updates
- Configuration modifications
- Any file modifications

### Step 4: Commit & Push

**Only after user explicitly approves:**

```bash
git add <files>
git commit -m "<type>: <description> (#<issue>)

- Detail 1
- Detail 2
- Detail 3"

git push -u origin <branch-name>
```

**Commit Message Format:**
- Format: `<type>: <description> (#<issue>)`
- Types: feat, fix, docs, chore, refactor, test, build, ci, perf
- Must include issue number in parentheses
- Body (optional): Bullet points with details

**Examples:**
```
feat: Add transaction batch import (#45)

- Implement CSV parser
- Add validation logic
- Update API endpoint

fix: Resolve camera permissions on Android (#52)

- Request permissions at runtime
- Handle permission denial gracefully
```

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

**PR Title Format:** `<type>: <Title>`
- NO issue number in title (GitHub adds PR # on merge)
- Use same type as branch

**PR Body:**
- Must start with `Closes #<issue>` to link and auto-close issue
- Describe what the PR does
- List specific changes
- Explain testing approach

**GitHub Action** automatically:
- Sets issue status to **In Progress** (when PR opens)
- Updates to **In Review** (when PR marked ready for review)

### Step 6: Review & Merge

**Main branch is protected:**
- All CI checks must pass
- Branch must be up-to-date with main
- PR review/approval required

**After merge:**
- **GitHub Action** automatically sets issue status to **QA/Testing**
- Issue remains in QA/Testing until release

### Step 7: Release

When QA confirms everything works:

1. Create release issue:
```bash
./.github/scripts/create-issue.sh \
  --title "release: Version 0.2.0" \
  --body "..."
```

2. Create release branch:
```bash
git checkout -b release/#<issue>-v0.2.0
```

3. Update versions and CHANGELOG
4. Create PR and merge

**GitHub Action** automatically:
- Detects release branch (`release/#*`)
- Sets all related issues to **Done** when release PR merges
- Triggers GitHub Actions for deployment

## Project Status Automation

The [.github/workflows/project-automation.yml](../.github/workflows/project-automation.yml) workflow handles all status transitions:

```yaml
Issues opened → Todo (auto)
PR opened → In Progress (auto)
PR ready for review → In Review (auto)
PR merged to main → QA/Testing (auto)
Release PR merged → Done (auto)
```

No manual status updates needed! 🎉

## Branch Protection Rules

**Main branch is protected:**
- ✅ Cannot push directly to main
- ✅ All changes must go through PRs
- ✅ All CI checks must pass
- ✅ Branch must be up-to-date with main before merging
- ✅ Issue must exist before creating branch
- ✅ Commits must reference issue number

**If accidentally on main:**
```bash
# Check current branch
git branch --show-current

# If output is "main", immediately:
# 1. Create issue first (if doesn't exist)
# 2. Then create branch:
git checkout -b <type>/#<issue>-<desc>
```

## Emergency Procedures

**If branch created without issue:**
```bash
# STOP - Create issue first
./.github/scripts/create-issue.sh --title "..." --body "..."
# Then create properly named branch
git checkout -b <type>/#<issue>-<desc>
```

**Hotfix for closed issue:**
- Prefer creating new issue for bugs found after merge
- Only reopen original issue if truly necessary
- Reopened issues require manual status update back to "In Progress"

## Commit Message Reference

### Format
```
<type>: <description> (#<issue>)

[optional body]
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **test**: Adding/updating tests
- **refactor**: Code refactoring
- **chore**: Maintenance tasks
- **build**: Build system changes
- **ci**: CI configuration changes
- **perf**: Performance improvements

### Rules
- Imperative mood: "add" not "added"
- First word after colon capitalized
- No period at end
- Issue number in parentheses
- Body with bullet points if needed

### Examples
```
feat: Add transaction batch import (#45)
fix: Resolve camera permissions on Android (#52)
docs: Update API documentation (#18)
chore: Bump version to 0.2.0 (#69)
```

## PR Title Reference

### Format
```
<type>: <Title>
```

### Rules
1. Type prefix is mandatory
2. NO issue number in title (linked via body)
3. First word after colon capitalized
4. No period at end
5. Imperative mood

### Examples
```
✅ feat: Add transaction batch import
✅ fix: Resolve camera permissions on Android
✅ docs: Update API documentation
✅ chore: Bump version to 0.2.0

❌ Update docs                           (missing type)
❌ feat: add transaction batch import    (lowercase)
❌ Fix bug #23                           (issue # in title)
❌ feat: Add import (#45)                (issue # in title)
❌ docs: Update API documentation.       (period at end)
```

## Issue Reopening Policy

**Preferred approach**: Create new issue for bugs found after merge
- Cleaner tracking
- Separate QA concerns from original implementation
- Better metrics

**When to reopen**:
- Critical hotfix needed immediately
- Bug is directly related to original implementation
- No new functionality, just fixing incomplete work

**M**Use natural language for issue titles**:
   - ✅ "Create OCR scan screen"
   - ✅ "Mobile: Add transaction batch import"
   - ✅ "Backend: Implement price history endpoint"
   - ❌ "feat: Create OCR scan screen"

2. Copilot will generate comprehensive issue descriptions
3. Use `.github/scripts/create-issue.sh` to create with automatic project linking
4. **Branch names and commit messages still use conventional commits** (feat, fix, docs, etc.)
5. Wait for user approval before committing (NO AUTO-COMMIT)

## Task Type Guidelines

### User Story (Parent Task)
- High-level feature description
- Can be broken down into child tasks (Mobile, Backend, CI, etc.)
- Example: "Add OCR receipt scanning feature"
- Child tasks: "Mobile: Create camera screen", "Backend: Parse OCR text with AI"

### Mobile Task
- iOS/Android implementation
- UI components, navigation, state management
- Example: "Mobile: Create transaction edit screen"

### Backend Task
- Server/API implementation
- Database changes, business logic
- Example: "Backend: Add product search endpoint"

### Mobile & Backend Task
- Requires changes on both sides
- End-to-end feature implementation
- Example: "Mobile & Backend: Implement Google Sheets sync"

### Bug
- Specify component (Mobile, Backend, CI, Documentation)
- Include steps to reproduce
- Example: "Fix camera permissions on Android"

### CI Task
- GitHub Actions workflows
- Deployment automation
- Example: "CI: Automate project status transitions"

### Documentation Task
- Docs updates, guides, API specifications
- Example: "Docs: Create task management workflow guide"

### Release
- Version bumps (patch, minor, major)
- CHANGELOG updates
- Example: "Version 0.2.0"ions:

1. Start with "Create a task for..." in natural language
2. Copilot will generate comprehensive issue description
3. Use `.github/scripts/create-issue.sh` to create with automatic project linking
4. Branch naming and commit messages still follow standard conventions
5. Wait for user approval before committing (NO AUTO-COMMIT)

## Related Documentation

- [Architecture](ARCHITECTURE.md) - System design
- [DevOps](DEVOPS.md) - Docker deployment
- [Branch Protection](BRANCH_PROTECTION.md) - Detailed protection rules
- [Copilot Instructions](../.github/copilot-instructions.md) - AI coding guidance
- [Contributing](../CONTRIBUTING.md) - Contribution guidelines
