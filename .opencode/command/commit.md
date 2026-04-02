---
description: Commits the local changes in atomic commits. This command is best run after completing an execute run successfully, and preparing for plan review.
---

# Commit Changes

You are tasked with creating git commits for the changes made during this session.

## Commit Types

Auto-detect the type from the diff using these conventional commit prefixes:

- **feat:** New feature or significant enhancement
- **fix:** Bug fix or correction to existing behaviour
- **perf:** Performance improvement (faster, less memory)
- **refactor:** Internal restructuring with no behaviour change
- **revert:** Reverting a previous commit
- **test:** Adding or correcting tests
- **chore:** Maintenance, dependency updates, no behaviour change
- **docs:** Documentation and thoughts updates only
- **ci:** CI/CD pipeline configuration changes
- **style:** Formatting only (whitespace, semicolons, indentation)
- **build:** Build system or external dependency changes
- **ops:** Infrastructure, deployment, operational changes

### Type Detection Notes

- **Markdown ≠ docs**: `.md` files in agentic/command paths (`.opencode/command/`, `.opencode/agent/`, `.claude/`, `CLAUDE.md`) define agent behaviour — classify them by what the change accomplishes (feat, fix, refactor, etc.), not by file extension.
- Reserve `docs` for human-facing documentation only: `README.md`, files under `docs/`, `CHANGELOG.md`, and other `.md` files outside command/agent directories.

## Commit Message Format

Every commit must follow this structure:

```
type: imperative title under 50 characters

- Why the change was needed
- What it does in 1-5 bullet points
- Each bullet wrapped at 72 characters

Delivers PAP-XXXX
```

- **Title**: conventional prefix, imperative mood, capitalised, no trailing period, ≤50 characters
- **Body**: 1-5 bullet points explaining why and what (omit body only for trivial changes)
- **Trailer**: `Delivers {issue_id}` on the last line when an issue ID was found
- **Language**: English only

## Issue ID

Determine the associated issue ID in this order:

1. **Session context** — If the session was invoked with an issue ID (e.g. /execute), use it
2. **Branch name** — Run `git branch --show-current` and extract the `{PREFIX}-{NUMBER}` segment (e.g. `feature/pap-7024-desc` → `PAP-7024`). Normalise to uppercase.
3. **Ask the user** — "Is there a Linear issue associated with these changes?"
4. **Omit** — If no issue, proceed without the `Delivers` trailer

## Process:

1. **Think about what changed:**
   - Review the conversation history and understand what was accomplished
   - Review the `git status -s` to get an idea of what files changed
   - Consider whether changes should be one commit or multiple logical commits
   - Use `git diff` on specific files if you need more context. Only do this if you have no knowledge of the changes in that file.

2. **Plan your commit(s):**
   - Identify which files belong together
   - **Auto-detect the commit type** from the diff using the types above
   - Draft messages following the Commit Message Format template
   - Include the `Delivers` trailer on the first commit only if an issue ID was resolved

3. **Present your plan to the user:**
   - List the files you plan to add for each commit
   - Show the full commit message(s) — title, body, and trailer
   - Ask: "I plan to create [N] commit(s) with these changes. Shall I proceed?"

4. **Execute upon confirmation:**
   - Use `git add` with specific files (never use `-A` or `.`)
   - Create multi-line commits: title line, blank line, body bullets, blank line, trailer
   - Show the result with `git log --oneline -n [N]`

## Remember:
- You have the full context of what was done in this session
- Group related changes into atomic commits
- Titles: imperative mood, capitalised, no trailing period, English only
- Bodies: explain *why*, not just *what*
- Include the `Delivers` trailer on the first commit when an issue ID was found
