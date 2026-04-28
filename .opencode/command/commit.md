---
description: Commits the local changes in atomic commits. Best run after execution succeeds and before plan review.
---

# Commit Changes

Thin wrapper that spawns the committer agent.

## Instructions

1. Parse the issue ID from `$ARGUMENTS` when provided.
2. Spawn the committer agent via the Task tool:
   - `subagent_type`: `"committer"`
   - `prompt`: `"Execute the commit workflow for issue {issue_id}. If this was invoked as part of a session where implementation work was done, use the available session summary plus git status and git diff to create suitable commit messages."`
3. When the agent returns:
   - If the output contains questions for the user, relay them exactly as presented.
   - Collect the user's response.
   - Resume the agent via the Task tool with `task_id` and the user's response.
   - Repeat until the agent signals completion.
4. Report the agent's final outcome to the user.

**issue_id**

$ARGUMENTS
