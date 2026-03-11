---
description: Commits the local changes in atomic commits. This command is best run after completing an execute run successfully, and preparing for plan review.
---

# Commit Changes

You are tasked with creating git commits for the changes made during this session.

## Commit Types

Use conventional commit prefixes to categorize changes:

- **fix:** Bugs that are being fixed or adjustments to how things work
- **feat:** Features that have been added
- **chore:** Tidying things up, not making substantial changes to how things work
- **refactor:** Changes that don't change the behavior, but do change the internal layout
- **docs:** Purely documentation and thoughts updates
- **ci:** Changes to how the CI system works

## Commit Message Format

All commits MUST include the ticket ID in the following format:
```
#[issue-number]-[description]
```

Examples:
- `#123-add-validation-error-message`
- `#45-add-dashboard-component`
- `#789-refactor-auth-service`

The ticket ID should be extracted from:
1. The plan file being executed
2. The ticket file in `thoughts/tickets/`
3. The feature branch name (format: `feature/[issue-number]-*`)

## Process:

1. **Identify the ticket ID:**
   - Check the current branch name (format: `feature/[issue-number]-*`)
   - Or check the plan file mentioned in the session
   - Or check the ticket file in `thoughts/tickets/`
   - The ticket ID is required for all commits

2. **Think about what changed:**
   - Review the conversation history and understand what was accomplished
   - Review the `git status -s` to get an idea of what files changed
   - Consider whether changes should be one commit or multiple logical commits
   - Use `git diff` on specific files if you need more context. Only do this if you have no knowledge of the changes in that file.

3. **Plan your commit(s):**
   - Identify which files belong together
   - **Select the appropriate commit type** from the list above based on the nature of the changes
   - Draft clear, descriptive commit messages using the format: `#[issue-number]-[description]`
   - Use imperative mood in commit messages
   - Focus on why the changes were made, not just what

4. **Present your plan to the user:**
   - List the files you plan to add for each commit
   - Show the commit message(s) you'll use (including the ticket ID)
   - Ask: "I plan to create [N] commit(s) with these changes. Shall I proceed?"

5. **Execute upon confirmation:**
   - Use `git add` with specific files (never use `-A` or `.`)
   - Create commits with your planned messages (including ticket ID)
   - Show the result with `git log --oneline -n [N]`

## Release Notes

Note: During release generation, commits with `chore:`, `docs:`, and `ci:` prefixes are automatically filtered out from the changelog to focus on user-facing changes. Other prefixes like `fix:` and `feat:` are included.

## Remember:
- You have the full context of what was done in this session
- Group related changes together
- Keep commits focused and atomic when possible
- The user trusts your judgment - they asked you to commit
- **Always include the ticket ID in commit messages** (format: `#[issue-number]-...`)

