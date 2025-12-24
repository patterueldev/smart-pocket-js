# GitHub Copilot - PR Workflow Guide

Complete guide for using GitHub Copilot (CLI and IDE extensions) to manage the entire PR lifecycle: create, review, test, and merge.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Creating Pull Requests](#creating-pull-requests)
- [PR Reviews with Copilot](#pr-reviews-with-copilot)
- [Running Tests](#running-tests)
- [Generating Reports](#generating-reports)
- [Merging Pull Requests](#merging-pull-requests)
- [Automated Workflows](#automated-workflows)
- [Best Practices](#best-practices)

---

## Prerequisites

### Install GitHub CLI with Copilot Extension

```bash
# Install GitHub CLI (if not already installed)
# macOS
brew install gh

# Windows (with winget)
winget install GitHub.cli

# Linux
# See: https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# Authenticate with GitHub
gh auth login

# Install Copilot extension
gh extension install github/gh-copilot

# Verify installation
gh copilot --version
```

### Configure IDE Extensions

**VS Code**:
- Install "GitHub Copilot" extension
- Install "GitHub Copilot Chat" extension
- Sign in with GitHub account

**JetBrains IDEs** (IntelliJ, WebStorm, etc.):
- Install "GitHub Copilot" plugin
- Sign in with GitHub account

---

## Creating Pull Requests

### Option 1: Using GitHub CLI with Copilot

```bash
# Create PR with Copilot-generated description
gh copilot suggest "create a pull request for my current branch"

# Use the new title convention
gh pr create --title "feat: #42 Backend - Add external API documentation" \
  --body "Closes #42\n\n$(gh copilot explain 'generate PR description based on my commits')"

# Or use interactive mode
gh pr create --web
```

### Option 2: Using Copilot Chat in IDE

In VS Code Copilot Chat:

```
@github Create a PR for my current branch with:
- Title: feat: #123 Backend - Add external API documentation
- Description based on my commits
- Include 'Closes #123' in the body
```

Copilot will generate the PR body following your template.

### Option 3: Generate PR Description from Commits

```bash
# Get commit messages
git log main..feat/build --oneline

# Ask Copilot to generate description
gh copilot suggest "generate a PR description summarizing these commits: $(git log main..feat/build --oneline)"

# Use the generated description
gh pr create --title "feat: add external API documentation" \
  --body "GENERATED_DESCRIPTION_HERE"
```

### Smart PR Description Generation

**Copilot Prompt**:
```
Generate a PR description following our template for these changes:
- Added GitHub Actions workflows (pr-check, main-ci, nightly)
- Created external API documentation (Actual Budget, OpenAI, PostgreSQL, Google Sheets)
- Added PR template and contribution guide
- Updated main README with new docs links

Include:
- Type of change (feature)
- Changes made (bulleted list)
- Testing performed
- Documentation updates
```

Copilot will generate a description matching your PR template.

---

## PR Reviews with Copilot

### Requesting Copilot Review

```bash
# View PR diff
gh pr diff

# Ask Copilot to review
gh copilot suggest "review this PR for potential issues"

# Or get specific feedback
gh copilot suggest "check this PR for security issues"
gh copilot suggest "analyze this PR for performance problems"
gh copilot suggest "verify this PR follows our coding conventions"
```

### IDE-Based Review with Copilot Chat

In VS Code:

```
@github Review the current changes for:
1. Code quality issues
2. Potential bugs
3. Security vulnerabilities
4. Performance concerns
5. Missing error handling
```

Copilot will analyze your changes and provide feedback.

### Automated PR Comments

**GitHub Actions + Copilot** (Advanced):

Create a workflow that uses Copilot to comment on PRs:

```yaml
# .github/workflows/copilot-review.yml
name: Copilot Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  copilot-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Get PR diff
        id: diff
        run: |
          gh pr diff ${{ github.event.pull_request.number }} > pr-diff.txt
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      # Use Copilot API to analyze (requires setup)
      # This is a placeholder - actual implementation would use Copilot API
      - name: Copilot Analysis
        run: |
          echo "Analyzing PR with Copilot..."
          # Copilot analysis would go here
```

### Manual Review with Copilot Assistance

```bash
# 1. Check out the PR branch
gh pr checkout 123

# 2. Ask Copilot to explain changes
gh copilot explain "What does this PR do?"

# 3. Review specific files with Copilot
gh copilot suggest "review the security of this code: $(cat src/auth.js)"

# 4. Generate review comments
gh copilot suggest "suggest improvements for this function"

# 5. Post review
gh pr review 123 --comment --body "COPILOT_GENERATED_FEEDBACK"
```

---

## Running Tests

### Test with Copilot Assistance

```bash
# Ask Copilot for the right test command
gh copilot suggest "how do I run tests for this project?"

# Copilot might suggest:
pnpm run test

# Run specific test types
gh copilot suggest "run unit tests only"
# Copilot suggests: pnpm run test -- --testPathPattern=unit

# Run coverage
gh copilot suggest "generate test coverage report"
# Copilot suggests: pnpm run test:coverage
```

### Test Debugging with Copilot

```bash
# If tests fail, ask Copilot for help
gh copilot suggest "why is this test failing: $(pnpm run test 2>&1 | tail -20)"

# Get suggestions for fixing tests
gh copilot suggest "how to fix this test error: [ERROR_MESSAGE]"
```

### Generate Test Reports

**Using Copilot to format test output**:

```bash
# Run tests and save output
pnpm run test:coverage > test-output.txt

# Ask Copilot to summarize
gh copilot explain "summarize this test report: $(cat test-output.txt)"

# Generate markdown report
gh copilot suggest "create a markdown table from this test output"
```

### Copilot Chat for Test Generation

In VS Code:

```
@workspace Generate tests for the parseReceipt function in 
src/services/ocr.js following our test patterns
```

Copilot will generate tests matching your existing test style.

---

## Generating Reports

### PR Summary Report

```bash
# Generate PR summary
gh copilot suggest "create a summary of PR #123 including changes, tests, and status"

# Get detailed change analysis
gh copilot explain "analyze the impact of changes in PR #123"
```

### Test Coverage Report

```bash
# Run coverage
pnpm run test:coverage

# Generate summary with Copilot
gh copilot explain "summarize this coverage report: $(cat coverage/coverage-summary.json)"

# Create markdown table
gh copilot suggest "convert this JSON coverage to markdown table"
```

### Performance Report

```bash
# Run performance tests
npm run test:perf

# Analyze with Copilot
gh copilot explain "analyze these performance metrics: $(cat perf-results.json)"
```

### Security Scan Report

```bash
# Run security audit
pnpm audit --json > audit-report.json

# Summarize with Copilot
gh copilot explain "summarize security vulnerabilities: $(cat audit-report.json)"

# Get remediation steps
gh copilot suggest "how to fix these npm audit findings"
```

### Custom Report Generation

**Copilot Prompt**:
```
Generate a PR report including:
1. Files changed: $(git diff --stat main...feature-branch)
2. Test results: $(pnpm run test 2>&1)
3. Coverage: $(cat coverage/coverage-summary.json)
4. Security: $(pnpm audit 2>&1)
5. Status: Ready for review

Format as markdown for GitHub comment.
```

---

## Merging Pull Requests

### Pre-Merge Checks with Copilot

```bash
# Verify PR is ready to merge
gh copilot suggest "check if PR #123 is ready to merge"

# Copilot will suggest checking:
# - CI status
# - Required reviews
# - Merge conflicts
# - Branch protection rules

# Check CI status
gh pr checks 123

# Verify no conflicts
gh pr diff 123 --color=never | grep "^<<<<<<<" && echo "Has conflicts!" || echo "No conflicts"

# Check reviews
gh pr view 123 --json reviews
```

### Merge Strategies with Copilot

```bash
# Ask Copilot for appropriate merge strategy
gh copilot suggest "what merge strategy should I use for a feature PR?"

# Copilot suggests one of:
# - Merge commit (preserves history)
# - Squash merge (clean history)
# - Rebase merge (linear history)

# Merge with squash (recommended for features)
gh pr merge 123 --squash --delete-branch

# Merge with standard merge
gh pr merge 123 --merge --delete-branch

# Merge with rebase
gh pr merge 123 --rebase --delete-branch
```

### Generate Merge Commit Message

```bash
# Get PR details
gh pr view 123 --json title,body,commits

# Ask Copilot to generate merge message
gh copilot suggest "generate a merge commit message for PR #123 that summarizes: $(gh pr view 123 --json title,body -q '.title + "\n" + .body')"

# Use generated message
gh pr merge 123 --squash --body "COPILOT_GENERATED_MESSAGE" --delete-branch
```

### Auto-Merge with Conditions

```bash
# Enable auto-merge when checks pass
gh pr merge 123 --auto --squash --delete-branch

# Copilot can help with the command
gh copilot suggest "enable auto-merge for PR #123 after checks pass"
```

---

## Automated Workflows

### Complete PR Workflow with Copilot

**Step 1: Create PR**
```bash
# Commit your changes
git add .
git commit -m "feat: add feature X"

# Push branch
git push origin feature/x

# Create PR with Copilot-generated description
gh copilot suggest "create PR from feature/x to main with description based on commits"
gh pr create --title "feat: add feature X" --body "GENERATED_DESCRIPTION"
```

**Step 2: Wait for CI**
```bash
# Watch CI status
gh pr checks --watch

# If tests fail, debug with Copilot
gh copilot suggest "analyze why CI failed for PR #123"
```

**Step 3: Review with Copilot**
```bash
# Self-review with Copilot
gh copilot suggest "review my changes for potential issues"

# Request human review
gh pr review 123 --request-reviewer @teammate
```

**Step 4: Address Feedback**
```bash
# Get review comments
gh pr view 123 --json reviews

# Use Copilot to address comments
gh copilot suggest "how to fix this review comment: [COMMENT_TEXT]"

# Make changes and push
git commit -am "fix: address review feedback"
git push
```

**Step 5: Merge**
```bash
# Verify ready to merge
gh pr checks 123
gh pr view 123 --json reviewDecision

# Merge with Copilot's help
gh copilot suggest "merge PR #123 with appropriate strategy"
gh pr merge 123 --squash --delete-branch
```

### Script: Complete PR Flow

Create a script with Copilot's help:

```bash
#!/bin/bash
# pr-flow.sh - Complete PR workflow with Copilot assistance

BRANCH=$(git branch --show-current)
TITLE=$1
ISSUE=$2

# 1. Create PR
echo "Creating PR..."
gh pr create --title "$TITLE" \
  --body "Closes #$ISSUE" \
  --draft

# 2. Run tests locally
echo "Running tests..."
pnpm run test || exit 1

# 3. Mark as ready
gh pr ready

# 4. Wait for checks
echo "Waiting for CI..."
gh pr checks --watch

# 5. Request review
echo "Requesting review..."
gh pr review --request-reviewer @maintainer

echo "PR created and ready for review!"
```

Usage:
```bash
./pr-flow.sh "feat: add feature X" 123
```

---

## Best Practices

### 1. Use Copilot for Documentation

```bash
# Generate changelog entry
gh copilot suggest "generate changelog entry for PR #123"

# Update README
gh copilot suggest "update README to document new feature"

# Generate API docs
gh copilot suggest "document this API endpoint"
```

### 2. Copilot for Code Quality

```bash
# Check code before pushing
gh copilot suggest "review this code for issues: $(cat src/new-feature.js)"

# Verify conventions
gh copilot suggest "does this code follow our style guide?"

# Security check
gh copilot suggest "check for security issues in this code"
```

### 3. Efficient PR Reviews

```bash
# Quick overview
gh copilot explain "what does PR #123 do?"

# Focus areas
gh copilot suggest "what should I focus on when reviewing PR #123?"

# Test suggestions
gh copilot suggest "what tests should I add for this PR?"
```

### 4. Merge Conflicts Resolution

```bash
# View conflicts
git diff --name-only --diff-filter=U

# Ask Copilot for help
gh copilot suggest "how to resolve merge conflicts in these files: $(git diff --name-only --diff-filter=U)"

# Get specific resolution
gh copilot suggest "resolve this merge conflict: $(git diff src/conflicted-file.js)"
```

### 5. PR Templates and Automation

Use Copilot to:
- Generate PR descriptions from templates
- Create test plans
- Write commit messages
- Generate release notes
- Update documentation

---

## Advanced: Copilot API Integration

### Custom PR Bot with Copilot

Create a bot that uses Copilot to:
1. Auto-review PRs
2. Suggest improvements
3. Generate test cases
4. Update documentation
5. Create release notes

Example workflow:

```yaml
# .github/workflows/copilot-bot.yml
name: Copilot PR Bot

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  copilot-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Analyze PR with Copilot
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          # Use gh copilot to analyze changes
          gh pr diff ${{ github.event.pull_request.number }} > changes.diff
          
          # Generate review (using Copilot API when available)
          # For now, use gh copilot suggest
          echo "Analyzing changes..."
      
      - name: Post Review Comment
        run: |
          gh pr comment ${{ github.event.pull_request.number }} \
            --body "Copilot Analysis: Changes look good! ✓"
```

---

## Quick Reference

### Common Commands

```bash
# Create PR
gh pr create --web

# Review PR
gh pr diff 123
gh pr checks 123

# Merge PR
gh pr merge 123 --squash --delete-branch

# Use Copilot
gh copilot suggest "your question"
gh copilot explain "explain this code"
```

### Copilot Prompts for PR Workflow

| Task | Copilot Prompt |
|------|----------------|
| Create PR | "create a pull request with generated description" |
| Review code | "review this code for issues" |
| Fix tests | "why is this test failing?" |
| Merge strategy | "what merge strategy should I use?" |
| Generate report | "summarize test results as markdown" |
| Write commit msg | "generate commit message for these changes" |
| Resolve conflict | "how to resolve this merge conflict?" |

---

## Resources

- **GitHub CLI**: https://cli.github.com/
- **Copilot Extension**: https://github.com/github/gh-copilot
- **VS Code Copilot**: https://marketplace.visualstudio.com/items?itemName=GitHub.copilot
- **Copilot Chat**: https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat
- **GitHub Actions**: https://docs.github.com/actions

---

## Summary

With GitHub Copilot, you can automate most of your PR workflow:

✅ **Create PRs** with AI-generated descriptions
✅ **Review code** with intelligent suggestions
✅ **Run tests** with smart debugging
✅ **Generate reports** in markdown
✅ **Merge PRs** with appropriate strategies
✅ **Automate workflows** with scripts

Combined with GitHub Actions, this creates a powerful CI/CD pipeline! 🚀
