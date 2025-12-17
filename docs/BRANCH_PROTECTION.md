# Branch Protection Rules

## Overview

To maintain code quality and prevent accidental direct pushes to `main`, we enforce branch protection rules that require all changes to go through pull requests.

## Setting Up Branch Protection

### GitHub Web UI (Recommended)

1. Go to: https://github.com/patterueldev/smart-pocket-js/settings/branches

2. Click **"Add rule"** or **"Add branch protection rule"**

3. **Branch name pattern**: `main`

4. **Enable the following settings**:

#### Protect matching branches
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1** (for solo projects, you can approve your own PRs)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ⬜ Require review from Code Owners (optional)
  
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Select required checks:
    - `build-and-test` (from pr-check.yml)
    - `Build & Push QA Images` (from deploy-qa.yml, if applicable)

- ✅ **Require conversation resolution before merging**

- ✅ **Require linear history** (prevents merge commits, enforces rebase/squash)

- ⬜ **Require deployments to succeed before merging** (optional)

- ⬜ **Lock branch** (prevents all pushes, too restrictive for active development)

- ⬜ **Do not allow bypassing the above settings** (optional, but recommended to keep unchecked for emergency fixes)

- ✅ **Restrict who can push to matching branches** (optional)
  - If enabled, add specific users/teams who can push directly
  - For solo projects, leave empty to block all direct pushes

- ⬜ **Allow force pushes** (should be disabled)
  - ⬜ Everyone
  - ⬜ Specify who can force push

- ⬜ **Allow deletions** (should be disabled)

#### Rules applied to everyone including administrators
- ⬜ **Include administrators** (optional)
  - If checked, even repo admins must follow these rules
  - Useful for team projects
  - For solo projects, you can leave unchecked for emergency access

5. Click **"Create"** or **"Save changes"**

---

## Recommended Configuration (Solo Project)

For a solo project where you're the only contributor:

### Minimum Protection (Recommended)
```
✅ Require a pull request before merging
   ✅ Require 1 approval (you can approve your own)
✅ Require status checks to pass
   ✅ build-and-test
✅ Require branches to be up to date
✅ Require conversation resolution
⬜ Include administrators (keep unchecked for flexibility)
```

### Strict Protection (Optional)
```
✅ All settings from Minimum Protection, plus:
✅ Require linear history
✅ Do not allow bypassing settings
✅ Include administrators
```

---

## What This Prevents

With branch protection enabled:

❌ **Direct pushes to main**
```bash
git push origin main
# Error: protected branch hook declined
```

❌ **Force pushes to main**
```bash
git push --force origin main
# Error: denied
```

❌ **Merging without PR approval**
```bash
gh pr merge --admin
# Error: required reviews not met
```

❌ **Merging with failing CI checks**
```bash
gh pr merge
# Error: required status checks not passed
```

---

## What You Should Do Instead

### ✅ Proper Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feat/#<issue>-description
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push feature branch**:
   ```bash
   git push -u origin feat/#<issue>-description
   ```

4. **Create pull request**:
   ```bash
   gh pr create --title "feat: Add new feature" --body "Description..."
   ```

5. **Wait for CI checks** (automated)

6. **Approve PR** (even if it's your own, for solo projects):
   ```bash
   gh pr review --approve
   ```

7. **Merge PR**:
   ```bash
   gh pr merge --squash --delete-branch
   ```

---

## Emergency Bypass (If Needed)

If you absolutely need to push directly to main (not recommended):

### Option 1: Temporarily Disable Protection
1. Go to branch protection settings
2. Edit the `main` rule
3. Uncheck protections temporarily
4. Make your push
5. **Re-enable protections immediately**

### Option 2: Use Admin Override (if "Include administrators" is unchecked)
```bash
# This will only work if you haven't checked "Include administrators"
git push origin main
```

---

## CI Status Checks

The following status checks are recommended:

| Check Name | Workflow | Purpose |
|------------|----------|---------|
| `build-and-test` | `.github/workflows/pr-check.yml` | Lint, test, build verification |
| `Build & Push QA Images` | `.github/workflows/deploy-qa.yml` | Ensure Docker images build successfully |

---

## Solo Developer Workflow

As a solo developer, you might think branch protection is overkill, but it provides:

✅ **Safety net**: Prevents accidental direct commits to main  
✅ **CI enforcement**: Ensures tests always run before merging  
✅ **Clean history**: Forces organized commits via PRs  
✅ **Documentation**: PRs serve as change documentation  
✅ **Best practices**: Keeps you in the habit for team projects  

**Self-approval is totally fine** for solo projects. The goal is to prevent accidents, not to slow you down.

---

## Troubleshooting

### "Push declined due to branch protection"

✅ **Solution**: Create a PR instead
```bash
# You're on main and made changes
git checkout -b fix/quick-fix
git add .
git commit -m "fix: quick fix"
git push -u origin fix/quick-fix
gh pr create --fill
gh pr review --approve
gh pr merge --squash --delete-branch
```

### "Required status checks have not succeeded"

✅ **Solution**: Wait for CI or fix failures
```bash
# Check workflow status
gh run list --limit 5

# View specific run
gh run view <run-id>

# Fix code, push again
git add .
git commit -m "fix: address CI failures"
git push
```

### "Pull request is not mergeable"

✅ **Solution**: Update branch
```bash
# On your feature branch
git fetch origin
git rebase origin/main
git push --force-with-lease
```

---

## Updating Protection Rules

If you need to modify the rules later:

1. Go to: https://github.com/patterueldev/smart-pocket-js/settings/branches
2. Find the `main` rule
3. Click **"Edit"**
4. Modify settings
5. Click **"Save changes"**

---

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development guidelines
- [RELEASE_FLOW.md](./RELEASE_FLOW.md) - Release process
