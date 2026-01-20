---
description: Review all changes, create a conventional commit on a new feature branch, and open a pull request. Use when the user wants to commit their work and create a PR.
alwaysApply: false
---

# Commit and Create PR

Create a conventional commit on a new branch and open a pull request.

## Instructions

1. **Review changes**
   - Run `git status` to see all changed/untracked files
   - Run `git diff` to review staged and unstaged changes
   - Run `git log --oneline -5` to see recent commit style

2. **Update CHANGELOG.md**
   - Read the existing `CHANGELOG.md` file
   - Add a new entry for today's date (format: `## [YYYY-MM-DD]`) at the top if it doesn't exist
   - Categorize the changes under appropriate sections:
     - `### Added` - new features
     - `### Changed` - changes to existing functionality
     - `### Deprecated` - soon-to-be removed features
     - `### Removed` - removed features
     - `### Fixed` - bug fixes
     - `### Security` - vulnerability fixes
   - Write a clear, concise description of the changes
   - Include technical details where relevant (new components, database changes, API endpoints, etc.)
   - If this is a significant feature, add subsections with bullet points for details
   - Leave a placeholder for the PR number (e.g., `([#XX](link))`) which will be updated after PR creation
   - Stage the updated CHANGELOG.md file

3. **Create branch**
   - Create a descriptive branch name based on changes (e.g., `feat/add-timebank`, `fix/login-bug`)
   - Checkout the new branch

4. **Create conventional commit**
   - Stage all relevant files (including CHANGELOG.md)
   - Write commit message following the Conventional Commits 1.0.0 specification
   - **CRITICAL: Never use `--no-verify` flag.** Pre-commit hooks must always run, even if they require the backend to be running. If the hook fails, inform the user they need to start the backend server before committing.
   - **CRITICAL: Always use `required_permissions: ['all']` when running git commit commands.** The pre-commit hook runs `npm run build` which needs to read `.env` files, requiring full filesystem access. Without full permissions, the build will fail with `EPERM: operation not permitted` errors.

5. **Push and create PR**
   - Push the branch to origin (use `required_permissions: ['all']` for network and certificate access)
   - Create a pull request using `gh pr create` with a clear title and description (use `required_permissions: ['all']`)
   - After PR is created, optionally update the CHANGELOG.md to replace the placeholder PR number with the actual PR number and link

## Conventional Commits 1.0.0 Specification

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description | SemVer |
|------|-------------|--------|
| `feat` | Introduces a new feature | MINOR |
| `fix` | Patches a bug | PATCH |
| `docs` | Documentation only changes | - |
| `style` | Formatting, no code change | - |
| `refactor` | Code change that neither fixes a bug nor adds a feature | - |
| `perf` | Performance improvement | - |
| `test` | Adding or updating tests | - |
| `build` | Changes to build system or dependencies | - |
| `ci` | Changes to CI configuration | - |
| `chore` | Other changes that don't modify src or test files | - |

### Breaking Changes

Indicate breaking changes in one of two ways:

1. Append `!` after type/scope: `feat!:` or `feat(api)!:`
2. Add footer: `BREAKING CHANGE: description`

Breaking changes correlate with MAJOR in SemVer.

### Scope

Optional scope provides context about which part of the codebase is affected:

```
feat(auth): add login timeout handling
fix(api): resolve null pointer in game service
```

### Body

Optional free-form text, separated by a blank line from the description. Use to explain the "what" and "why" of the change.

### Footer

Optional key-value pairs following git trailer format:

```
Refs: #123
Reviewed-by: Name
BREAKING CHANGE: description of breaking change
```

## Examples

```bash
# Simple feature
feat: add timebank tracking for employees

# Feature with scope
feat(auth): add login timeout handling

# Bug fix with body
fix(api): resolve null pointer in game service

The service was failing when employee data was missing.
Added null check before accessing employee fields.

# Breaking change with !
feat(api)!: change authentication endpoint response format

# Breaking change with footer
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files

Refs: #123
```
