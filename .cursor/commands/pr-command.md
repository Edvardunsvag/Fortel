---
description: Review all changes, create a conventional commit on a new feature branch, and open a pull request. Use when the user wants to commit their work and create a PR.
alwaysApply: false
---

# Commit and Create PR

## Steps

1. **Review changes** - `git status` and `git diff` to understand what was implemented
2. **Check for sensitive files** - Before proceeding, check for files that might pass through gitignore but should not be committed:
   - Run `git status --porcelain` to get all changed files (staged and unstaged)
   - Check for sensitive file patterns:
     - `.env*` files (`.env`, `.env.local`, `.env.production`, etc.)
     - Files with sensitive keywords in name: `*secret*`, `*key*`, `*password*`, `*token*`, `*credential*`, `*api-key*`
     - Database files: `*.db`, `*.sqlite`, `*.sqlite3`
     - Private key files: `*.pem`, `*.key`, `*.p12`, `*.pfx`
     - `appsettings.json` or `appsettings.Production.json` (unless explicitly approved)
   - If any sensitive files are detected:
     - **DO NOT create the PR**
     - Report the detected files to the user with a clear error message
     - Suggest adding them to `.gitignore` if they're not already there
     - Exit the workflow
3. **Update CHANGELOG.md** - Add brief entry under today's date (`## [YYYY-MM-DD]`) in appropriate section (Added/Changed/Fixed/Removed). Keep it concise - one line per change.
4. **Create branch** - `feat/`, `fix/`, or `refactor/` prefix (e.g., `feat/add-timebank`)
5. **Commit** - Use conventional commit format (see below)
   - **CRITICAL: Never use `--no-verify`** - hooks must run
   - **CRITICAL: Use `required_permissions: ['all']`** - pre-commit hook needs full filesystem access
6. **Push and create PR** - Use `required_permissions: ['all']` for network access. Keep PR description brief and focused on what was implemented.

## Commit Format

```
<type>[optional scope]: <description>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `style`, `perf`, `test`, `build`, `ci`, `chore`

**Examples:**
- `feat: add timebank tracking`
- `fix(api): resolve null pointer in game service`
- `refactor(auth): simplify login flow`
- `feat(api)!: change authentication endpoint` (breaking change)
