---
description: Review all changes, create a conventional commit on a new feature branch, and open a pull request. Use when the user wants to commit their work and create a PR.
alwaysApply: false
---

# Commit and Create PR

## Steps

1. **Review changes** - `git status` and `git diff` to understand what was implemented
2. **Update CHANGELOG.md** - Add brief entry under today's date (`## [YYYY-MM-DD]`) in appropriate section (Added/Changed/Fixed/Removed). Keep it concise - one line per change.
3. **Create branch** - `feat/`, `fix/`, or `refactor/` prefix (e.g., `feat/add-timebank`)
4. **Commit** - Use conventional commit format (see below)
   - **CRITICAL: Never use `--no-verify`** - hooks must run
   - **CRITICAL: Use `required_permissions: ['all']`** - pre-commit hook needs full filesystem access
5. **Push and create PR** - Use `required_permissions: ['all']` for network access. Keep PR description brief and focused on what was implemented.

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
