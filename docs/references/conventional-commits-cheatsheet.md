# Conventional Commits Cheatsheet

**Source**: https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13

See how a minor change to your commit message style can make a difference.

```bash
git commit -m"<type>(<optional scope>): <description>" \
  -m"<optional body>" \
  -m"<optional footer>"
```

> **Note**: This cheatsheet is opinionated, however it does not violate the specification of conventional commits.

> **Tip**: Take a look at [git-conventional-commits](https://github.com/qoomon/git-conventional-commits); a CLI util to ensure these conventions, determine version and generate changelogs.

## Commit Message Formats

### General Commit

```
<type>(<optional scope>): <description>

<optional body>

<optional footer>
```

### Initial Commit

```
chore: init
```

### Merge Commit

```
Merge branch '<branch name>'
```

Follows default git merge message.

### Revert Commit

```
Revert "<reverted commit subject line>"
```

Follows default git revert message.

## Types

### Changes relevant to the API or UI:
- **`feat`** - Commits that add, adjust or remove a new feature to the API or UI
- **`fix`** - Commits that fix an API or UI bug of a preceded `feat` commit

### Code structure:
- **`refactor`** - Commits that rewrite or restructure code without altering API or UI behavior
  - **`perf`** - Commits are special type of `refactor` commits that specifically improve performance

### Code style:
- **`style`** - Commits that address code style (e.g., white-space, formatting, missing semi-colons) and do not affect application behavior

### Testing:
- **`test`** - Commits that add missing tests or correct existing ones

### Documentation:
- **`docs`** - Commits that exclusively affect documentation

### Build and deployment:
- **`build`** - Commits that affect build-related components such as build tools, dependencies, project version, CI/CD pipelines, ...
- **`ops`** - Commits that affect operational components like infrastructure, deployment, backup, recovery procedures, ...

### Other:
- **`chore`** - Commits that represent tasks like initial commit, modifying `.gitignore`, ...

## Scopes

The `scope` provides additional contextual information.

- The scope is an **optional** part
- Allowed scopes vary and are typically defined by the specific project
- **Do not use issue identifiers as scopes**

## Breaking Changes Indicator

- A commit that introduce breaking changes must be indicated by an `!` before the `:` in the subject line e.g. `feat(api)!: remove status endpoint`
- Breaking changes should be described in the commit footer section, if the commit description isn't sufficiently informative

## Description

The `description` contains a concise description of the change.

- The description is a **mandatory** part
- Use the imperative, present tense: "change" not "changed" nor "changes"
  - Think of `This commit will...` or `This commit should...`
- Do not capitalize the first letter
- Do not end the description with a period (`.`)
- In case of breaking changes also see breaking changes indicator

## Body

The `body` should include the motivation for the change and contrast this with previous behavior.

- The body is an **optional** part
- Use the imperative, present tense: "change" not "changed" nor "changes"

## Footer

The `footer` should contain issue references and informations about Breaking Changes

- The footer is an **optional** part, except if the commit introduce breaking changes
- Optionally reference issue identifiers (e.g., `Closes #123`, `Fixes JIRA-456`)
- Breaking Changes must start with the word `BREAKING CHANGE:`
  - For a single line description just add a space after `BREAKING CHANGE:`
  - For a multi line description add two new lines after `BREAKING CHANGE:`

## Versioning

If your next release contains commit with...
- Breaking Changes → increment the **major** version
- API relevant changes (`feat` or `fix`) → increment the **minor** version
- Else → increment the **patch** version

## Examples

### Feature commits

```
feat: add email notifications on new direct messages
```

```
feat(shopping cart): add the amazing button
```

```
feat!: remove ticket list endpoint

refers to JIRA-1337

BREAKING CHANGE: ticket endpoints no longer supports list all entities.
```

### Fix commits

```
fix(shopping-cart): prevent order an empty shopping cart
```

```
fix(api): fix wrong calculation of request body checksum
```

```
fix: add missing parameter to service call

The error occurred due to <reasons>.
```

### Performance commits

```
perf: decrease memory footprint for determine unique visitors by using HyperLogLog
```

### Build commits

```
build: update dependencies
```

```
build(release): bump version to 1.0.0
```

### Refactor commits

```
refactor: implement fibonacci number calculation as recursion
```

### Style commits

```
style: remove empty line
```

## Decision Table for Type Selection

| Condition | Type |
|-----------|------|
| Bug fix? | `fix` |
| New or changed feature in API/UI? | `feat` |
| Performance improvement? | `perf` |
| Code restructuring without behavior change? | `refactor` |
| Formatting only? | `style` |
| Tests added/corrected? | `test` |
| Documentation only? | `docs` |
| Build tools, dependencies, versions? | `build` |
| DevOps, infrastructure, or backups? | `ops` |
| Anything else | `chore` |

## References

- https://www.conventionalcommits.org/
- https://github.com/angular/angular/blob/master/CONTRIBUTING.md
- http://karma-runner.github.io/1.0/dev/git-commit-msg.html
- https://github.com/github/platform-samples/tree/master/pre-receive-hooks
