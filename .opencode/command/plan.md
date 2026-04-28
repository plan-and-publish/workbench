---
description: Create an implementation plan from an issue. Provide an issue ID as the argument. Best run in a new session.
---

# Implementation Plan

Thin wrapper that spawns the planner agent.

## Instructions

1. Parse the issue ID from `$ARGUMENTS`.
2. Spawn the planner agent via the Task tool:
   - `subagent_type`: `"planner"`
   - `prompt`: `"Execute the planning workflow for issue {issue_id}."`
3. When the agent returns:
   - If the output contains questions for the user, relay them exactly as presented.
   - Collect the user's response.
   - Resume the agent via the Task tool with `task_id` and the user's response.
   - Repeat until the agent signals completion.
4. Report the agent's final outcome to the user.

**issue_id**

$ARGUMENTS
